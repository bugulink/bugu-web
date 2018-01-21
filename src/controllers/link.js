import * as cdn from '../middlewares/cdn';

export async function list(ctx) {
  const { Link, query } = ctx.orm();
  const { body } = ctx.request;
  const { user } = ctx.session;
  const where = {
    creator: user.email
  };
  if (body.status) {
    where.status = body.status;
  }
  const links = await Link.findAndCountAll({
    where,
    offset: +body.offset,
    limit: +body.limit,
    order: [
      ['id', 'DESC']
    ]
  });
  let files = [];
  if (links.length) {
    const sql = 'select lf.link_id, f.id, f.name, f.status from r_link_file lf inner join t_file f on lf.file_id=f.id where lf.link_id in (?)';
    const ids = links.map(v => v.id);
    files = await query(sql, [ids]);
  }
  ctx.body = {
    code: 0,
    data: {
      links,
      files
    }
  };
}

// sharer views link detail
export async function detail(ctx) {
  const { Link, query } = ctx.orm();
  const { id } = ctx.request.body;
  const { user } = ctx.session;
  const link = await Link.findById(id);

  if (link && link.creator === user.email) {
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

    this.body = {
      code: 0,
      data: {
        link,
        files
      },
      message: 'Find the link success'
    };
  } else {
    this.body = {
      code: 1,
      msg: 'Cannot find this link'
    };
  }
}
