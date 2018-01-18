import Router from 'koa-router';
import * as home from './controllers/home';
import * as link from './controllers/link';

export default function routes(app, config) {
  const router = new Router();

  router.get('/', home.main);
  router.get('/links', link.listPage);

  async function injectParams(ctx, next) {
    ctx.state.env = config.env;
    ctx.state.year = (new Date()).getFullYear();
    ctx.state.cdnDomain = config.cdn.domain;
    ctx.cookies.set('XSRF-TOKEN', ctx.csrf, {
      httpOnly: false
    });
    await next();
  }

  app.use(injectParams);
  app.use(router.routes());
  app.use(router.allowedMethods());
}
