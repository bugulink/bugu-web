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
  }
};
