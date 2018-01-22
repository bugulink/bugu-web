'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RLinkFile', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    link_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'link ID'
    },
    file_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'file ID'
    }
  }, {
    tableName: 'r_link_file',
    comment: 'link and file relation table'
  });
};
