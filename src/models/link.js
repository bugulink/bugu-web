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
    receiver: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      comment: 'link receivers'
    },
    message: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      comment: 'sharer message'
    },
    creator: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'sharer'
    },
    ttl: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'TTL'
    },
    status: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '1-active, 2-removed'
    }
  }, {
    tableName: 't_link',
    comment: 'link table'
  });
};
