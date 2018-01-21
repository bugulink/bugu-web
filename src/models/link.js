'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Link', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'ID'
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'link code'
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
