import { createLogger, format, transports } from 'winston';
import '../../helpers/env.mjs';

const loggingLevels = {
	levels: {
        error: 0,
		verbose: 1,
		debug: 2
	}
};

const loggingTransports = [
	new transports.Console({ level: 'error' })
];

if (global.$logger.jsonataLogfile) {
	loggingTransports.push(new transports.File({ filename: global.$logger.jsonataLogfile }));
}

const loggingFormat = format.printf(({ level, message, timestamp }) => {
	return `${timestamp}: [${level}] ${message}`;
});

export const jsonataLogger = createLogger({
	levels: loggingLevels.levels,
	level: 'debug',
	format: format.combine(
		format.timestamp(),
		loggingFormat
	),
	transports: loggingTransports
});

export default {
	log(text, tag = '', level = 'verbose') {
		jsonataLogger.log(level, `${tag}:${text}`);
	},
	error(text, tag = '') {
		jsonataLogger.error(`${tag}:${text}`);
	}
};

