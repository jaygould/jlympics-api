module.exports = (sequelize: any, DataTypes: any) => {
	const tracked_users_fitbit = sequelize.define(
		'tracked_users_fitbit',
		{
			fitbitId: DataTypes.STRING,
			fitbitToken: DataTypes.STRING,
			fitbitName: DataTypes.STRING
		},
		{ freezeTableName: true }
	);
	tracked_users_fitbit.associate = function(models: any) {
		// associations can be defined here
	};
	return tracked_users_fitbit;
};