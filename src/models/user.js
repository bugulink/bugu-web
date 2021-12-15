import { genToken, verifyTOTP } from '../utils';

module.exports = function(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user email'
    },
    totp_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'totp key'
    },
    capacity: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 2 * 1024 * 1024,
      comment: 'user capacity'
    }
  }, {
    tableName: 't_user',
    comment: 'user table'
  });

  User.auth = async function(email, captcha) {
    const user = await this.findOne({
      where: { email }
    });
    if (user && verifyTOTP(captcha, user.totp_key)) {
      user.totp_key = null;
      return user;
    }
    return null;
  };

  User.add = async function(email) {
    const result = await this.create({
      email,
      totp_key: genToken(64)
    });
    return result;
  };

  return User;
};
