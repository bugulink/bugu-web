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
      attribute: ['id'],
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
      attribute: ['id'],
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
      link: link.id,
      code: link.code,
      message: link.message,
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
      v.key = '';
    }
  });

  ctx.body = { link, files };
}

// download page
export async function download(ctx) {
  const { Link, query } = ctx.orm();
  const { id } = ctx.params;
  const { linkAuth } = ctx.session;
  const link = await Link.findById(id);

  ctx.assert(link && link.status === 1, 404, 'Link is not found');
  ctx.state.link = link;

  if (link.code && !linkAuth[link.code]) {
    ctx.state.linkCode = true;
  } else {
    ctx.state.linkCode = false;
    const sql = 'select f.name, f.key, f.status from r_link_file lf inner join t_file f on lf.file_id=f.id where lf.link_id=?';
    const files = await query(sql, [link.id]);

    files.forEach(v => {
      // actived file
      if (v.status === 1) {
        v.key = cdn.downUrl(v.key);
      } else {
        v.key = '';
      }
    });
    ctx.state.files = files;
  }

  await ctx.render('index');
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
