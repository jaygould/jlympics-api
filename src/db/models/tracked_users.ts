module.exports = (sequelize: any, DataTypes: any) => {
	const tracked_users = sequelize.define(
		'tracked_users',
		{
			fbId: DataTypes.STRING,
			fbToken: DataTypes.STRING,
			first: DataTypes.STRING,
			last: DataTypes.STRING
		},
		{}
	);
	tracked_users.associate = function(models: any) {
		// associations can be defined here
	};
	return tracked_users;
};
