const cron = require('node-cron');
import * as FitbitService from '../api/services/fitbit';

cron.schedule('0 */3 * * *', () => {
	FitbitService.updateAllUserFitbitData();
	FitbitService.updateAllUsersFitbitTokens();
});
