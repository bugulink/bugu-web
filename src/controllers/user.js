export async function login(ctx) {
  const { User } = ctx.orm();
  const { body } = ctx.request;
  const user = await User.auth(body.email, body.captcha);
  if (user) {
    ctx.session.authenticated = true;
    ctx.session.user = user;
  } else {
    ctx.flash('error', 'The captcha is invalid');
  }
  ctx.redirect('/');
}

export async function isLogin(ctx, next) {
  if (ctx.session.authenticated) {
    await next();
  } else {
    ctx.flash('error', 'The captcha is invalid');
    ctx.redirect('/');
  }
}

export async function logout(ctx) {
  if (ctx.session.authenticated) {
    delete ctx.session.authenticated;
    delete ctx.session.user;
  }
  ctx.redirect('/');
}
