'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('File', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'file name'
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'file path'
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'hash value'
    },
    creator: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'uploader'
    },
    size: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'file size'
    },
    status: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '1-active, 2-removed'
    }
  }, {
    tableName: 't_file',
    comment: 'file table'
  });
};
