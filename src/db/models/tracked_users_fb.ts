module.exports = (sequelize: any, DataTypes: any) => {
	const tracked_users_fb = sequelize.define(
		'tracked_users_fb',
		{
			fbId: DataTypes.STRING,
			fbToken: DataTypes.STRING,
			first: DataTypes.STRING,
			last: DataTypes.STRING,
			fitbitId: DataTypes.STRING
		},
		{ freezeTableName: true }
	);
	tracked_users_fb.associate = function(models: any) {
		models.tracked_users_fb.belongsTo(models.tracked_users_fitbit, {
			foreignKey: 'fitbitId',
			targetKey: 'id'
		});
	};
	return tracked_users_fb;
};
