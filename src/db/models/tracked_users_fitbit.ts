module.exports = (sequelize: any, DataTypes: any) => {
	const tracked_users_fitbit = sequelize.define(
		'tracked_users_fitbit',
		{
			fitbitId: DataTypes.STRING,
			fitbitToken: DataTypes.STRING,
			fitbitRefreshToken: DataTypes.STRING,
			fitbitName: DataTypes.STRING,
			isActive: DataTypes.INTEGER
		},
		{ freezeTableName: true }
	);
	tracked_users_fitbit.associate = function(models: any) {
		// associations can be defined here
	};
	return tracked_users_fitbit;
};
