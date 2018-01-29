import { genTOTP } from '../utils';

export async function main(ctx) {
  await ctx.render('index');
}

export async function captcha(ctx) {
  const { User } = ctx.orm();
  const { email } = ctx.request.body;
  const { lastTime } = ctx.session;

  // wait 1 minute
  const min = 60 * 1000;
  const now = Date.now();
  if (lastTime && (now - lastTime) <= min) {
    ctx.throw(400, 'Try again in a minute');
  } else {
    ctx.session.lastTime = now;
  }

  let user = await User.findOne({
    where: { email }
  });

  if (!user) {
    user = await User.add(email);
  }

  await ctx.sendMail(user.email, null, 'sendCaptcha', {
    user: user.email,
    captcha: genTOTP(user.totp_key)
  });

  ctx.body = { message: 'Success' };
}
