import { totp } from 'notp';

export async function main() {

}

export async function captcha(ctx) {
  try {
    const { User } = ctx.orm();
    // const { email } = ctx.request.body;
    const email = 'nick@cnood.com';
    let user = await User.findOne({
      where: { email }
    });
    if (!user) {
      user = await User.add(email);
    }
    await ctx.sendMail(user.email, null, 'sendCaptcha', { captcha: totp.gen(user.totp_key) });

    ctx.body = { code: 0 };
  } catch (e) {
    ctx.body = { code: 1 };
  }
}
