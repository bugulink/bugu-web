import config from '../config';
import { makeRequest, encode64 } from '../utils';
import * as cdn from '../middlewares/cdn';

export async function list(ctx) {
  const { File } = ctx.orm();
  const { offset, limit } = ctx.request.body;
  const { user } = ctx.session;
  const data = await File.findAndCountAll({
    raw: true,
    where: {
      creator: user.id
    },
    offset: parseInt(offset, 10) || 0,
    limit: parseInt(limit, 10) || 20,
    order: 'id DESC'
  });
  data.rows.forEach(file => {
    file.url = cdn.downUrl(file.key);
  });
  ctx.body = data;
}

export async function uptoken(ctx) {
  const { user } = ctx.session;
  const prefix = `${user.id}/${Date.now()}/`;
  ctx.body = {
    prefix,
    token: cdn.uptoken(prefix)
  };
}

export async function upload(ctx) {
  const { File } = ctx.orm();
  const { user } = ctx.session;
  const { key, size, name, data, token } = ctx.request.body;

  ctx.assert(key, 400, 'Key is required');
  ctx.assert(size, 400, 'Size is required');
  ctx.assert(name, 400, 'Name is required');
  ctx.assert(data, 400, 'Data is required');
  ctx.assert(token, 400, 'Token is required');

  const host = config.cdn.uphost;
  const url = `${host}/mkfile/${size}/key/${encode64(key)}`;
  const request = makeRequest(3);
  const info = await request(url, data, {
    headers: {
      Authorization: `UpToken ${token}`
    }
  });
  ctx.body = await File.create({
    size,
    name,
    key: info.key,
    hash: info.hash,
    creator: user.id,
    ttl: config.fileTTL
  });
}

export async function remove(ctx) {
  const { File, RLinkFile } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;
  const file = await File.findById(id);

  ctx.assert(file && file.creator === user.id, 400, 'File is not existed');
  const count = await RLinkFile.count({
    where: {
      file_id: file.id
    }
  });
  ctx.assert(count === 0, 400, 'File is related to one sharing link');

  await cdn.removeFile(file.key);
  // remove success
  await file.destroy();

  ctx.body = file;
}
