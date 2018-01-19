export async function login(ctx) {
  const { User } = ctx.orm();
  const { email, code } = ctx.request.body;

  ctx.assert(email, 400, 'Email is required');
  ctx.assert(code, 400, 'Security code is required');

  const user = await User.auth(email, code);

  ctx.assert(user, 403, 'Security code is invalid');
  ctx.session.authenticated = true;
  ctx.session.user = user;
  ctx.body = user;
}

export async function isLogin(ctx, next) {
  if (ctx.session.authenticated) {
    await next();
  } else {
    if (ctx.request.method === 'GET') {
      ctx.session.returnTo = ctx.request.originalUrl;
    }
    ctx.redirect('/login');
  }
}

export async function logout(ctx) {
  if (ctx.session.authenticated) {
    delete ctx.session.authenticated;
    delete ctx.session.user;
  }
  ctx.redirect('/');
}
