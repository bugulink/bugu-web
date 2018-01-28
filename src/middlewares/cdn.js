'use strict';

import qiniu from 'qiniu';
import config from '../config';

const { accessKey, secretKey, domain, bucket } = config.cdn;
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// generate upload token
export function uptoken(prefix = '') {
  // File size limit 2G
  const SIZE = 2 * 1024 * 1024 * 1024;
  const putPolicy = new qiniu.rs.PutPolicy({
    isPrefixalScope: 1,
    scope: `${bucket}:${prefix}`,
    expires: 6 * 3600,
    fsizeLimit: SIZE
    // fileType: 1
  });
  return putPolicy.uploadToken(mac);
}

// generate download address
export function downUrl(key) {
  const conf = new qiniu.conf.Config();
  const manager = new qiniu.rs.BucketManager(mac, conf);
  // validity 6 hour
  const deadline = parseInt(Date.now() / 1000) + 3600 * 6;
  return manager.privateDownloadUrl(domain, key, deadline);
}

// remove cdn file
export function removeFile(key) {
  const conf = new qiniu.conf.Config();
  const manager = new qiniu.rs.BucketManager(mac, conf);
  return new Promise((resolve, reject) => {
    manager.delete(bucket, key, err => {
      err ? reject(err) : resolve();
    });
  });
}

// combine all files
export function combineFiles(link, files) {
  const conf = new qiniu.conf.Config();
  const bucManager = new qiniu.rs.BucketManager(mac, conf);
  // validity 1 hour
  const deadline = parseInt(Date.now() / 1000) + 3600;
  const operManager = new qiniu.fop.OperationManager(mac, config);

  let key = null;
  const fops = ['mkzip/4'];
  files.forEach(v => {
    const url = bucManager.privateDownloadUrl(domain, v.key, deadline);
    fops.push(`/encoding/${qiniu.util.urlsafeBase64Encode(url)}`);
    if (!key) {
      key = v.key;
    }
  });
  const options = {
    // 'notifyURL': 'https://bugu.link/combine/callback',
    'force': false
  };

  return new Promise((resolve, reject) => {
    operManager.pfop(bucket, key, fops, null, options, (err, res) => {
      err ? reject(err) : resolve(res.persistentId);
    });
  });
}
