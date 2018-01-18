'use strict';

import { generateToken } from '../middlewares/util';
import { totp } from 'notp';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'user email'
    },
    totp_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'totp key'
    }
  }, {
    tableName: 't_user',
    comment: 'user table',
    classMethods: {
      async auth(email, captcha) {
        let user = await this.findOne({
          where: { email }
        });
        if (user && totp.verify(captcha, user.totp_key, { window: -10 })) {
          user.totp_key = null;
          return user;
        }
        return null;
      },
      async add(email) {
        const result = await this.create({
          email,
          totp_key: generateToken()
        });
        return result;
      }
    }
  });
};
