'use strict';
module.exports = {
	up: (queryInterface: any, Sequelize: any) => {
		return queryInterface.createTable('tracked_users', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			fbId: {
				type: Sequelize.STRING
			},
			fbToken: {
				type: Sequelize.STRING
			},
			first: {
				type: Sequelize.STRING
			},
			last: {
				type: Sequelize.STRING
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
		return queryInterface.dropTable('tracked_users');
	}
};
