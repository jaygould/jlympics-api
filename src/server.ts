// Get dependencies
import express from 'express';
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const chalk = require('chalk');
const compression = require('compression');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const expressStatusMonitor = require('express-status-monitor');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Load environment variables
require('dotenv').config();

// Route handlers
const authApi = require('./api/v1/auth');
const facebookAuthApi = require('./api/v1/facebook');
const fitbitAuthApi = require('./api/v1/fitbit');

// Create server
const app: express.Application = express();

// Express configuration
app.set(
	'port',
	process.env.API_PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000
);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(
	express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
);

// Error handler
app.use(errorHandler());

// API routes
app.use('/v1/auth', authApi);
app.use('/v1/auth/facebook', facebookAuthApi);
app.use('/v1/auth/fitbit', fitbitAuthApi);

// Init crons
require('./cron/index');

const server = app.listen(app.get('port'), () => {
	console.log(
		'%s App is running at http://localhost:%d in %s mode',
		chalk.green('✓'),
		app.get('port'),
		app.get('env')
	);
	console.log('  Press CTRL-C to stop\n');
});

// Web sockets setup
const io = require('socket.io')(server);

// Status monitor uses it's own socket.io instance by default, so we need to
// pass our instance as a parameter else it will throw errors on client side
app.use(expressStatusMonitor({ websocket: io, port: app.get('port') }));
