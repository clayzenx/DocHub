import { createLogger, format, transports } from 'winston';
import '../../helpers/env.mjs';

const loggingLevels = {
	levels: {
		alert: 0,
		error: 1,
		warn: 2,
		info: 3,
		verbose: 4,
		debug: 5
	}
};

const loggingTransports = [
	new transports.Console()
];

if (global.$logger.logfile) {
	transports.push(new transports.File({ filename: global.$logger.logfile }));
}

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
	transports: loggingTransports
});

export default {
	log(text, tag = '', level = 'info') {
		mainLogger.log(level, `${tag}:${text}`);
	},
	info(text, tag = '') {
		mainLogger.info(`${tag}:${text}`);
	},
	error(text, tag = '') {
		mainLogger.error(`${tag}:${text}`);
	},
	level(level) {
		if (mainLogger.levels[level]) {
			mainLogger.level = level;
			return { message: `Уровень логирования успешно изменён на ${level}.` };
		} else return { error: `Уровень логирования ${level} не существует.` };
	}
};
