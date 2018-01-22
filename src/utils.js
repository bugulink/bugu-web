'use strict';

import crypto from 'crypto';
import { totp } from 'notp';

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
