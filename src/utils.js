'use strict';

import crypto from 'crypto';
import { totp } from 'notp';
import axios from 'axios';

// TOTP time 5 minutes
const TOTP_TIME = 300;

export function genToken() {
  let buffer = crypto.randomBytes(256);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function genTOTP(key) {
  return totp.gen(key, { time: TOTP_TIME });
}

export function verifyTOTP(token, key) {
  return totp.verify(token, key, {
    window: 1,
    time: TOTP_TIME
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function makeRequest(maxRetry, method = 'post') {
  let retry = 0;
  return function request(url, data, config) {
    return axios[method](url, data, config)
      .then(res => Promise.resolve(res.data))
      .catch((e) => {
        retry++;
        if (retry === maxRetry) {
          return Promise.reject(e);
        }
        // Delay 1 ms
        return delay(1).then(() => request(url, data, config));
      });
  };
}

export function encode64(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
}
