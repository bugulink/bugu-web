import * as cdn from '../middlewares/cdn';

export async function add(ctx) {
  const { File } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  try {
    body.creator = user.email;
    const file = await File.create(body);
    ctx.body = {
      code: 0,
      data: file
    };
  } catch (e) {
    console.warn(e.stack);
    this.body = {
      code: 1,
      message: 'Upload file failed'
    };
  }
}

export async function list(ctx) {
  const { File, query } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  const where = {
    creator: user.email
  };
  if (body.status) {
    where.status = body.status;
  }
  const files = await File.findAndCountAll({
    where,
    offset: +body.offset,
    limit: +body.limit,
    order: [
      ['id', 'DESC']
    ]
  });
  let links = [];
  if (files.length) {
    const sql = 'select lf.file_id, l.id, l.code, l.status from r_link_file lf inner join t_link l on lf.link_id=l.id where lf.file_id in (?)';
    const ids = files.map(v => v.id);
    links = await query(sql, [ids]);
  }
  ctx.body = {
    code: 0,
    data: {
      files,
      links
    }
  };
}

export async function uptoken(ctx) {
  const { user } = ctx.session;
  const prefix = `${user.id}/${Date.now()}/`;
  ctx.body = {
    prefix,
    token: cdn.uptoken(prefix)
  };
}
