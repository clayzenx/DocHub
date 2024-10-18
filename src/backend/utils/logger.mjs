import { createLogger, format, transports } from "winston";
import '../helpers/env.mjs';

const loggingLevels = {
	levels: {
		alert: 0,
		error: 1, 
		warn: 2,
		info: 3,
		verbose: 4,
		debug: 5
	},
	/* colors: {
		alert: 'red',
		error: 'red',
		warn: 'yellow',
		info: 'green',
		verbose: 'cyan',
		debug: 'blue'
	} */
};

const loggingFormat = format.printf(({ level, message, timestamp }) => {
	return `${timestamp}: [${level}] ${message}`;
});

export const mainLogger = createLogger({
	levels: loggingLevels.levels,
	level: global.$logger.level,
	format: format.combine(
		format.timestamp(),
		loggingFormat
	),
	transports: [
		new transports.File({ filename: global.$logger.logfile }),
		new transports.Console({ level: 'info' })
	]
});

export default {
	log(text, tag = '', level = 'info') {
		// eslint-disable-next-line no-console
		// console.log(`${Date.now()}:${tag}:${text}`);
		mainLogger.log(level, `${tag}:${text}`);
	},
	info(text, tag = '') {
		mainLogger.info(`${tag}:${text}`);
	},
	error(text, tag = '') {
		// eslint-disable-next-line no-console
		// console.error(`${Date.now()}:${tag}:${text}`);
		mainLogger.error(`${tag}:${text}`);
	},
	level(level) {
		if (mainLogger.levels[level]) {
			mainLogger.level = level;
			return { message: `Уровень логирования успешно изменён на ${level}.` };
		} else return { error: `Уровень логирования ${level} не существует.` };
	}
};
