'use strict';

import nm from 'nodemailer';
import template from 'lodash.template';
import { downUrl } from './qiniu';

export default function(app, options = {}) {
  const templates = options.templates || {};
  const transport = nm.createTransport(options);
  // 添加 Render 函数
  Object.keys(templates).forEach(k => {
    const html = `<p style="width:640px;margin:0 auto;padding:15px;color:#666;-webkit-font-smoothing:antialiased;font-family:'Helvetica Neue',Helvetica,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',微软雅黑,SimSun,sans-serif;">${templates[k].html}</p>`;
    templates[k].render = template(html, {
      interpolate: /{{([\s\S]+?)}}/g
    });
  });

  app.use(function * mailHandler(next) {
    if (this.sendMail) return yield * next;

    this.sendMail = (to, cc, tplName, context, files = []) => {
      const tpl = templates[tplName];
      const attachments = files.map(f => ({
        filename: f.name,
        path: downUrl(f.url)
      }));
      return transport.sendMail({
        from: options.from,
        to: to,
        cc: cc,
        attachments: attachments,
        subject: tpl.subject,
        html: tpl.render(context)
      });
    };

    yield * next;
  });
}
