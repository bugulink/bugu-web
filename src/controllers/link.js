import config from '../config';
import { genToken, genCode, convertSize } from '../utils';
import * as cdn from '../middlewares/cdn';

export async function add(ctx) {
  const { Link, RLinkFile, File, sequelize } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  const transaction = await sequelize.transaction();
  try {
    const files = await File.findAll({
      attributes: ['id'],
      where: {
        id: {
          $in: body.ids
        },
        creator: user.id
      },
      transaction
    });

    ctx.assert(files && files.length, 400, 'No file is uploaded');

    const link = await Link.create({
      id: genToken(),
      code: genCode(),
      ttl: config.fileTTL,
      creator: user.id
    }, {
      transaction
    });

    const rlfs = [];

    files.forEach(v => {
      rlfs.push({
        link_id: link.id,
        file_id: v.id
      });
    });

    await RLinkFile.bulkCreate(rlfs, {
      transaction
    });

    await transaction.commit();
    ctx.body = link;
  } catch (err) {
    await transaction.rollback();
    console.warn(err.stack);
    throw err;
  }
}

export async function sendEmail(ctx) {
  const { Link, RLinkFile, File, sequelize } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  const transaction = await sequelize.transaction();
  try {
    const files = await File.findAll({
      attributes: ['id'],
      where: {
        id: {
          $in: body.ids
        },
        creator: user.id
      },
      transaction
    });

    ctx.assert(files && files.length, 400, 'No file is uploaded');

    const link = await Link.create({
      id: genToken(),
      code: genCode(),
      receiver: body.receiver.join(';'),
      message: body.message,
      ttl: config.fileTTL,
      creator: user.id
    }, {
      transaction
    });

    const rlfs = [];
    let size = 0;

    files.forEach(v => {
      size += v.size;
      rlfs.push({
        link_id: link.id,
        file_id: v.id
      });
    });

    await RLinkFile.bulkCreate(rlfs, {
      transaction
    });

    await ctx.sendMail(body.receiver, null, 'sendLink', {
      sender: user.email,
      link: `https://bugu.link/download/${link.id}`,
      code: link.code,
      message: link.message || 'No message',
      size: convertSize(size),
      total: files.length,
      ttl: link.ttl / 24 / 36000
    });

    await transaction.commit();
    ctx.body = link;
  } catch (err) {
    await transaction.rollback();
    console.warn(err.stack);
    throw err;
  }
}

export async function list(ctx) {
  const { Link, query } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  const links = await Link.findAndCountAll({
    where: {
      status: 1,
      creator: user.id
    },
    offset: +body.offset,
    limit: +body.limit,
    order: [
      ['id', 'DESC']
    ]
  });
  let files = [];
  if (links.length) {
    const sql = 'select lf.link_id, f.id, f.name, f.ttl from r_link_file lf inner join t_file f on lf.file_id=f.id where lf.link_id in (?)';
    const ids = links.map(v => v.id);
    files = await query(sql, [ids]);
  }
  ctx.body = { links, files };
}

// sharer views link detail
export async function detail(ctx) {
  const { Link, query } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;
  const link = await Link.findById(id);

  ctx.assert(link && link.creator === user.id, 400, 'Cannot find this link');
  const sql = 'select f.name, f.key, f.ttl from r_link_file lf inner join t_file f on lf.file_id=f.id where lf.link_id=?';
  const files = await query(sql, [link.id]);

  files.forEach(v => {
    // actived file
    if (v.status === 1) {
      v.key = cdn.downUrl(v.key);
    } else {
      v.key = null;
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

  ctx.assert(link && link.status === 1, 404, 'Link is not found');

  if (link.code && !linkAuth[link.id]) {
    ctx.state.csrf = ctx.csrf;
    ctx.state.isCode = true;
  } else {
    ctx.state.isCode = false;
    const sql = 'select f.name, f.key, f.ttl, f.createdAt from r_link_file lf inner join t_file f on lf.file_id=f.id where lf.link_id=?';
    const files = await query(sql, [link.id]);

    files.forEach(v => {
      // expired file
      if (v.createdAt.getTime() + v.ttl * 1000 < Date.now()) {
        v.key = null;
        link.package = null;
      } else {
        v.key = cdn.downUrl(v.key);
      }
    });
    ctx.state.files = files;
    if (link.package) {
      link.package = cdn.downUrl(link.package);
    }
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
