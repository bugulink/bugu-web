import qiniu from 'qiniu';
import { encodePath } from 'uri-utils';
import config from '../config';
import { encode64 } from '../utils';

const { accessKey, secretKey, domain, bucket } = config.cdn;
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const conf = new qiniu.conf.Config();

// generate upload token
export function uptoken(prefix = '') {
  // File size limit 2G
  const SIZE = 2 * 1024 * 1024 * 1024;
  const putPolicy = new qiniu.rs.PutPolicy({
    isPrefixalScope: 1,
    scope: `${bucket}:${prefix}`,
    expires: 6 * 3600,
    fsizeLimit: SIZE,
    fileType: 1
  });
  return putPolicy.uploadToken(mac);
}

// generate download address
export function downUrl(key) {
  const manager = new qiniu.rs.BucketManager(mac, conf);
  // validity 6 hour
  const deadline = parseInt(Date.now() / 1000) + 3600 * 6;
  return manager.privateDownloadUrl(domain, encodePath(key), deadline);
}

// remove cdn file
export function removeFile(key) {
  const manager = new qiniu.rs.BucketManager(mac, conf);
  return new Promise((resolve, reject) => {
    manager.delete(bucket, key, err => {
      err ? reject(err) : resolve();
    });
  });
}

export function uploadIndex(files) {
  const bucManager = new qiniu.rs.BucketManager(mac, conf);
  // validity 1 hour
  const deadline = parseInt(Date.now() / 1000) + 3600;
  const urls = files.map((v, i) => {
    const url = bucManager.privateDownloadUrl(domain, encodePath(v.key), deadline);
    return `/url/${encode64(url)}/alias/${encode64((i + 1) + '-' + v.name)}`;
  });
  const options = {
    scope: bucket
  };
  const putPolicy = new qiniu.rs.PutPolicy(options);
  const uploadToken = putPolicy.uploadToken(mac);
  const formUploader = new qiniu.form_up.FormUploader(conf);
  const putExtra = new qiniu.form_up.PutExtra();

  return new Promise((resolve, reject) => {
    formUploader.put(uploadToken, null, urls.join('\r\n'), putExtra, (err,
      res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

// combine all files
export function combineFiles(link, key) {
  const operManager = new qiniu.fop.OperationManager(mac, config);
  const saveas = encode64(`${bucket}:${link.creator}/zip/${Date.now()}/All.zip`);
  const fops = [`mkzip/4|saveas/${saveas}`];
  const options = {
    notifyURL: 'https://bugu.link/combine/callback',
    force: false
  };

  return new Promise((resolve, reject) => {
    operManager.pfop(bucket, key, fops, null, options, (err, res) => {
      err ? reject(err) : resolve(res.persistentId);
    });
  });
}
