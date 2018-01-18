'use strict';

import crypto from 'crypto';

export function generateToken() {
  let buffer = crypto.randomBytes(256);
  return crypto.createHash('sha1').update(buffer).digest('hex');
}
