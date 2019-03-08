import { join } from 'path';
import redisStore from 'koa-redis';
import { version } from '../package.json';

const { env } = process;
const debug = env.NODE_ENV !== 'production';
const port = env.BUGU_PORT || 8080;
const keys = (env.BUGU_KEYS || 'bugu,link').split(',');
const maxAge = 30 * 24 * 3600 * 1000;
const logging = debug ? console.log : false;
const pool = {
  maxConnections: 10,
  minConnections: 0,
  maxIdleTime: 30000
};
const linkTTL = parseInt(env.BUGU_LINK_TTL) || 7 * 24 * 3600;
const fileTTL = parseInt(env.BUGU_FILE_TTL) || 14 * 24 * 3600;
const capacity = parseInt(env.BUGU_CAPACITY) || 5 * 1024 * 1024 * 1024;

const mail = debug ? {
  from: 'admin@example.com',
  name: 'minimal',
  version: '0.1.0',
  send(mail, callback) {
    const input = mail.message.createReadStream();
    const chunks = [];
    input.on('data', (chunk) => {
      chunks.push(chunk);
    });
    input.on('end', () => {
      console.log(Buffer.concat(chunks).toString());
      callback(null, true);
    });
  }
} : {
  from: env.BUGU_EMAIL_FROM,
  host: env.BUGU_EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: env.BUGU_EMAIL_USER,
    pass: env.BUGU_EMAIL_PASS
  }
};

export default {
  keys,
  port,
  debug,
  version,
  env: {
    title: 'Bugu - A secure file-sharing site',
    description: 'Bugu.link is a secure file-sharing site',
    staticRoot: debug ? 'http://localhost:8000' : env.BUGU_STATIC
  },
  session: {
    maxAge,
    key: 'sid',
    store: debug ? null : redisStore()
  },
  linkTTL,
  fileTTL,
  capacity,
  viewPath: join(__dirname, '../views'),
  database: {
    pool,
    logging,
    name: 'bugu',
    dialect: 'mysql',
    modelPath: join(__dirname, 'models'),
    database: env.BUGU_DB_NAME || 'db_bugu',
    username: env.BUGU_DB_USER || 'root',
    password: env.BUGU_DB_PASS || '',
    host: env.BUGU_DB_HOST || '127.0.0.1',
    port: env.BUGU_DB_PORT || 3306
  },
  cdn: {
    bucket: env.BUGU_QN_NAME || 'bucket',
    accessKey: env.BUGU_QN_AK || 'accessKey',
    secretKey: env.BUGU_QN_SK || 'secretKey',
    domain: env.BUGU_QN_DOMAIN || 'http://bugu.link',
    uphost: env.BUGU_QN_UPHOST || 'http://up.qiniu.com'
  },
  mail: {
    ...mail,
    templates: {
      sendCaptcha: {
        subject: '{{code}} is your code for sign in bugu.link',
        html: `
          Dear {{user}}
          <br><br>Your <a href="https://bugu.link">bugu.link</a> code is <span style="font-weight: 500; color: #f4364c;">{{code}}</span>. It will be expired in 5 minutes.
          <br><br><br><br>To make sure our emails arrive, please add noreply@bugu.link to your contacts.
        `
      },
      sendLink: {
        subject: 'Bugu.link remind you to get your files',
        html: `
          <span style="font-size: 24px;">
            <span style="color: #f4364c;">{{sender}}</span> sent you some files
          </span>
          <br><br>{{total}} files, {{size}} in total・ Will be expired in {{ttl}} days
          <br><br><br><br>Link: <a href="{{link}}">{{link}}</a>
          <br><br>Code: <span style="font-weight: 500; color: #f4364c;">{{code}}</span>
          <br><br>Message: {{message}}
          <br><br><br><br><br><br><br><br>The service is provided by <a href="https://bugu.link">bugu.link</a>
        `
      }
    }
  }
};
