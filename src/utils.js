import { totp } from 'notp';
import axios from 'axios';
import { customAlphabet, nanoid } from 'nanoid';

// TOTP time 5 minutes
const TOTP_TIME = 300;

export function genToken(len = 21) {
  return nanoid(len);
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

export function genCode(len = 4) {
  return customAlphabet('1234567890', len)();
}

const mags = ' KMGTPEZY';
export function humanSize(bytes, precision) {
  const magnitude = Math.min(Math.log(bytes) / Math.log(1024) | 0, mags.length - 1);
  const result = bytes / (1024 ** magnitude);
  const suffix = `${mags[magnitude].trim()}B`;
  return result.toFixed(precision) + suffix;
}

function pluralize(time, label) {
  if (time === 1) {
    return time + label;
  }
  return `${time}${label}s`;
}

export function remain(date, ttl) {
  const exp = date.getTime() + ttl * 1000;
  return Math.floor((exp - Date.now()) / 1000);
}

export function formatTTL(ttl) {
  if (ttl <= 0) {
    return 'Expired';
  }
  const { round } = Math;
  if (ttl < 3600) {
    return pluralize(round(ttl / 60), ' minute');
  } else if (ttl < 86400) {
    return pluralize(round(ttl / 3600), ' hour');
  }

  return pluralize(round(ttl / 86400), ' day');
}
