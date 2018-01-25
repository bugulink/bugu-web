import { genTOTP } from '../utils';

export async function main(ctx) {
  await ctx.render('index');
}

export async function captcha(ctx) {
  const { User } = ctx.orm();
  const { email } = ctx.request.body;
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
