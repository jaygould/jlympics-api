'use strict';
module.exports = {
	up: (queryInterface: any, Sequelize: any) => {
		return queryInterface.createTable('fitbit_activity', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			fitbitId: {
				type: Sequelize.STRING
			},
			month: {
				type: Sequelize.INTEGER
			},
			activityType: {
				type: Sequelize.STRING
			},
			activityValue: {
				type: Sequelize.TEXT
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			}
		});
	},
	down: (queryInterface: any, Sequelize: any) => {
		return queryInterface.dropTable('fitbit_activity');
	}
};
