async function errorHandler(ctx, next) {
  try {
    await next();
    if (404 === ctx.response.status && !ctx.response.body) ctx.throw(404);
  } catch (err) {
    console.error(err.stack || err);

    const status = err.status || 500;
    const message = err.message || 'Internal server error';

    ctx.app.emit('error', err, ctx);
    ctx.status = status;

    switch (ctx.accepts('html', 'text', 'json')) {
      case 'text':
        ctx.type = 'text/plain';
        ctx.body = message;
        break;
      case 'html':
        ctx.type = 'text/html';
        await ctx.render('error', { status, message });
        break;
      default:
        ctx.type = 'application/json';
        ctx.body = { message };
    }
  }
}

export default function(app) {
  app.use(errorHandler);
}
