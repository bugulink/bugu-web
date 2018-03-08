module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RLinkPersistent', {
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
    persistent_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'persistent ID'
    }
  }, {
    tableName: 'r_link_persistent',
    comment: 'link and persistent table'
  });
};
