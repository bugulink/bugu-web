'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Link', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      comment: 'ID'
    },
    code: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: 'link code'
    },
    package: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'all file package url'
    },
    creator: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'sharer'
    },
    status: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '1-active, 2-suspended, 3-removed'
    }
  }, {
    tableName: 't_link',
    comment: 'link table'
  });
};
