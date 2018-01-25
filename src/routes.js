import Router from 'koa-router';
import * as file from './controllers/file';
import * as home from './controllers/home';
import * as link from './controllers/link';
import * as user from './controllers/user';

export default function routes(app, config) {
  const router = new Router();

  router.get('/', home.main);
  router.get('/login', home.main);
  router.get('/links', user.isLogin, home.main);
  router.get('/link/:id', user.isLogin, home.main);
  router.get('/files', user.isLogin, home.main);
  router.get('/file/:id', user.isLogin, home.main);

  router.get('/download/:id', link.download);
  router.post('/download/check_code', link.checkCode);

  router.post('/link/add', user.isLogin, link.add);
  router.post('/link/send_email', user.isLogin, link.sendEmail);
  router.post('/links', user.isLogin, link.list);
  router.post('/link/detail', user.isLogin, link.detail);
  router.post('/link/change_code', user.isLogin, link.changeCode);
  router.post('/link/remove', user.isLogin, link.remove);

  router.post('/files', user.isLogin, file.list);
  router.post('/uptoken', user.isLogin, file.uptoken);
  router.post('/upload', user.isLogin, file.upload);
  router.post('/file/remove', user.isLogin, file.remove);

  router.post('/captcha', home.captcha);
  router.post('/login', user.login);
  router.get('/logout', user.logout);

  async function injectParams(ctx, next) {
    ctx.state.env = config.env;
    ctx.state.user = ctx.session.user;
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
