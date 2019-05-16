'use strict';
module.exports = {
	up: (queryInterface: any, Sequelize: any) => {
		return queryInterface.createTable('tracked_users_fitbit', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			fitbitId: {
				type: Sequelize.STRING
			},
			fitbitToken: {
				type: Sequelize.STRING
			},
			fitbitRefreshToken: {
				type: Sequelize.STRING
			},
			fitbitName: {
				type: Sequelize.STRING
			},
			isActive: {
				type: Sequelize.INTEGER
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
		return queryInterface.dropTable('tracked_users_fitbit');
	}
};
