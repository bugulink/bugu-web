import config from '../config';
import { genToken, genCode, humanSize, remain, formatTTL } from '../utils';
import * as cdn from '../middlewares/cdn';

export async function add(ctx) {
  const { Link, RLinkFile, File, RLinkPersistent, sequelize } = ctx.orm();
  const { ids, receiver, message } = ctx.request.body;
  const { user } = ctx.session;

  ctx.assert(Array.isArray(ids) && ids.length, 400, 'No files uploaded');

  const transaction = await sequelize.transaction();
  try {
    const files = await File.findAll({
      transaction,
      attributes: ['id', 'size', 'key'],
      where: {
        id: { $in: ids },
        creator: user.id
      }
    });

    ctx.assert(files.length, 400, 'No files uploaded');

    const mailto = Array.isArray(receiver) ? receiver.join(';') : '';
    const link = await Link.create({
      id: genToken(),
      code: genCode(),
      ttl: config.fileTTL,
      creator: user.id,
      receiver: mailto,
      message: message
    }, { transaction });
    const linkFiles = files.map(file => ({
      link_id: link.id,
      file_id: file.id
    }));

    await RLinkFile.bulkCreate(linkFiles, { transaction });

    if (mailto) {
      const size = files.reduce((p, c) => (p + c.size), 0);
      await ctx.sendMail(mailto, null, 'sendLink', {
        sender: user.email,
        link: `https://bugu.link/download/${link.id}`,
        code: link.code,
        message: link.message || 'No message',
        size: humanSize(size, 1),
        total: files.length,
        ttl: link.ttl / (24 * 3600)
      });
    }

    // generate download all link
    const persistent = await cdn.combineFiles(link, files);
    await RLinkPersistent.create({
      link_id: link.id,
      persistent_id: persistent
    }, { transaction });

    await transaction.commit();
    ctx.body = link;
  } catch (err) {
    console.error(err.stack);
    await transaction.rollback();
    throw err;
  }
}

export async function list(ctx) {
  const { Link, query } = ctx.orm();
  const { offset, limit } = ctx.request.body;
  const { user } = ctx.session;
  const data = await Link.findAndCountAll({
    where: {
      status: 1,
      creator: user.id
    },
    offset: parseInt(offset, 10) || 0,
    limit: parseInt(limit, 10) || 20,
    order: [['createdAt', 'DESC']]
  });
  const linkIds = data.rows.map(link => link.id);
  let files = [];
  if (linkIds.length) {
    const sql = `
      SELECT lf.link_id, f.id, f.name, f.size
      FROM r_link_file lf
      INNER JOIN t_file f ON lf.file_id=f.id
      WHERE lf.link_id IN (?)
    `;
    files = await query(sql, [linkIds]);
  }
  ctx.body = { ...data, files };
}

// sharer views link detail
export async function detail(ctx) {
  const { Link, query } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;
  const link = await Link.findById(id);

  ctx.assert(link, 400, 'Link not found');
  ctx.assert(link.creator === user.id, 400, 'You have no permission');

  const sql = `
    SELECT f.id, f.name, f.key, f.ttl, f.size, f.createdAt
    FROM r_link_file lf
    INNER JOIN t_file f ON lf.file_id=f.id
    WHERE lf.link_id=?
  `;
  const files = await query(sql, [link.id]);
  files.forEach(file => {
    file.remain = remain(file.createdAt, file.ttl);
    if (file.remain > 0) {
      file.url = cdn.downUrl(file.key);
    }
  });
  ctx.body = { link, files };
}

// download page
export async function download(ctx) {
  const { Link, query } = ctx.orm();
  const { id } = ctx.params;
  const linkAuth = ctx.session.linkAuth || {};
  const link = await Link.findById(id);
  const ttl = remain(link.createdAt, link.ttl);

  ctx.assert(link && link.status === 1 && ttl >= 0, 404, 'Link is not found');

  if (link.code && !linkAuth[link.id]) {
    ctx.state.csrf = ctx.csrf;
    ctx.state.isCode = true;
  } else {
    ctx.state.isCode = false;
    const sql = `
      SELECT f.name, f.key, f.size, f.ttl, f.createdAt
      FROM r_link_file lf
      INNER JOIN t_file f ON lf.file_id=f.id
      WHERE lf.link_id=?
    `;
    const files = await query(sql, [link.id]);
    files.forEach(file => {
      const time = remain(file.createdAt, file.ttl);
      // expired file
      if (time < 0) {
        file.key = null;
        link.package = null;
      } else {
        file.key = cdn.downUrl(file.key);
      }
      file.ttl = formatTTL(time);
      file.size = humanSize(file.size, 1);
    });
    ctx.state.files = files;
    if (link.package) {
      link.package = cdn.downUrl(link.package);
    }
    link.ttl = formatTTL(ttl);
  }
  ctx.state.link = link;
  await ctx.render('download');
}

// change code
export async function changeCode(ctx) {
  const { Link } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;

  const link = await Link.findById(id);
  ctx.assert(link && link.creator === user.id && link.status === 1, 400, 'You have no permission');

  const code = link.code ? null : genCode();
  await link.update({ code });

  ctx.body = link;
}

// remove link status=0
export async function remove(ctx) {
  const { Link } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;

  const link = await Link.findById(id);
  ctx.assert(link && link.creator === user.id && link.status === 1, 400, 'You have no permission');

  await link.update({ status: 0 });

  ctx.body = link;
}

// check download page code
export async function checkCode(ctx) {
  const { Link } = ctx.orm();
  const { id } = ctx.params;
  const { code } = ctx.request.body;

  try {
    ctx.assert(code, 400, 'Code is required');

    if (!ctx.session.linkAuth) {
      ctx.session.linkAuth = {};
    }

    const link = await Link.findById(id);
    ctx.assert(link && link.status === 1, 404, 'Link is not found');
    ctx.assert(link.code === code, 400, 'Code is invalid');
    ctx.session.linkAuth[link.id] = true;

    ctx.redirect(`/download/${link.id}`);
  } catch (e) {
    console.warn(e);
    ctx.flash('error', e.message || 'System error');
    ctx.redirect(`/download/${id}`);
  }
}
