export async function login() {
  const { User } = this.orm();
  const { body } = this.request;
  const user = await User.auth(body.email, body.captcha);
  if (user) {
    this.session.authenticated = true;
    this.session.user = user;
  } else {
    this.flash('error', 'The captcha is invalid');
  }
  this.redirect('/');
}

export async function isLogin(next) {
  if (this.session.authenticated) {
    await next();
  } else {
    this.flash('error', 'The captcha is invalid');
    this.redirect('/');
  }
}

export async function logout() {
  if (this.session.authenticated) {
    delete this.session.authenticated;
    delete this.session.user;
  }
  this.redirect('/');
}
