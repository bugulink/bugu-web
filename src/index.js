import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import CSRF from 'koa-csrf';
import view from 'koa-view';
import ORM from 'koa-orm';

import config from './config';
import routes from './routes';
import error from './middlewares/error';
import flash from './middlewares/flash';
import mail from './middlewares/mail';

const app = new Koa();

app.use(bodyParser());
app.use(logger());

/** Sessions **/
app.keys = config.keys;
app.use(session(config.session, app));

/** CSRF */
app.use(new CSRF());

/** View & I18N **/
app.use(view(config.viewPath, {
  noCache: config.debug
}));

/** ORM */
app.orm = ORM(config.database);
app.use(app.orm.middleware);

app.orm.database().sync({
  force: false
}).then(() => {
  console.log('Sync done.');
});

/** Middlewares **/
error(app);
flash(app);
mail(app, config.mail);

/** Router **/
routes(app, config);

if (!module.parent) {
  const port = config.port || 3000;
  app.listen(port);
  console.log('Running site at: http://127.0.0.1:' + port);
}

export default app;
