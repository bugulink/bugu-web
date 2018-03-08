export default function(app) {
  const key = 'messages';

  app.use(async(ctx, next) => {
    ctx.state[key] = ctx.session[key] || {};

    delete ctx.session[key];

    ctx.flash = function(type, msg) {
      ctx.session[key] = ctx.session[key] || {};
      ctx.session[key][type] = msg;
    };

    await next();

    if (ctx.status === 302 && ctx.session && !(ctx.session[key])) {
      ctx.session[key] = ctx.state[key];
    }
  });
}
