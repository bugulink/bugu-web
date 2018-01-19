import { join } from 'path';
import { version } from '../package.json';

const debug = process.env.NODE_ENV !== 'production';
const port = process.env.BUGU_PORT || 8080;
const keys = (process.env.BUGU_KEYS || 'bugu,link').split(',');
const maxAge = 30 * 24 * 3600 * 1000;
const logging = debug ? console.log : false;
const pool = {
  maxConnections: 10,
  minConnections: 0,
  maxIdleTime: 30000
};

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
      console.log(Buffer.concat(chunks));
      callback(null, true);
    });
  }
} : {
  from: process.env.BUGU_EMAIL_FROM,
  host: process.env.BUGU_EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.BUGU_EMAIL_USER,
    pass: process.env.BUGU_EMAIL_PASS
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
    staticRoot: debug ? 'http://localhost:8000' : process.env.BUGU_STATIC
  },
  session: {
    key: 'sid',
    maxAge
  },
  viewPath: join(__dirname, '../views'),
  database: {
    pool,
    logging,
    name: 'bugu',
    dialect: 'mysql',
    modelPath: join(__dirname, 'models'),
    database: process.env.BUGU_DB_NAME || 'db_bugu',
    username: process.env.BUGU_DB_USER || 'root',
    password: process.env.BUGU_DB_PASS || '',
    host: process.env.BUGU_DB_HOST || '127.0.0.1',
    port: process.env.BUGU_DB_PORT || 3306
  },
  cdn: {
    bucket: process.env.BUGU_QN_NAME || 'bucket',
    accessKey: process.env.BUGU_QN_AK || 'accessKey',
    secretKey: process.env.BUGU_QN_SK || 'secretKey',
    domain: process.env.BUGU_QN_DOMAIN || 'http://bugu.link'
  },
  mail: {
    ...mail,
    templates: {
      sendCaptcha: {
        subject: 'Your captcha for signing in bugu.link',
        html: `
          {{captcha}}
        `
      }
    }
  }
};
