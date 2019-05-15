module.exports = (sequelize: any, DataTypes: any) => {
	const fitbit_activity = sequelize.define(
		'fitbit_activity',
		{
			fitbitId: DataTypes.STRING,
			month: DataTypes.INTEGER,
			activityType: DataTypes.STRING,
			activityValue: DataTypes.STRING
		},
		{ freezeTableName: true }
	);
	fitbit_activity.associate = function(models: any) {
		// associations can be defined here
	};
	return fitbit_activity;
};
