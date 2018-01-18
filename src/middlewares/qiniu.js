'use strict';

import qiniu from 'qiniu';
import config from '../config';

const { accessKey, secretKey, domain } = config.qiniu;
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// generate upload token
export function uptoken(bucket) {
  bucket = bucket || config.qiniu.bucket;
  const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket });
  return putPolicy.uploadToken(mac);
}

// generate download address
export function downUrl(key) {
  const config = new qiniu.conf.Config();
  const manager = new qiniu.rs.BucketManager(mac, config);
  // validity 24 hour
  const deadline = parseInt(Date.now() / 1000) + 3600 * 24;
  return manager.privateDownloadUrl(domain, key, deadline);
}
