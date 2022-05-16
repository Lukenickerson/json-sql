const NOOP = () => {};

/** Gets a logger or console object from a configuration object, and optionally deletes it */
function getLoggerFromConfig(config = {}, deleteFromConfig = true) {
	if (typeof config !== 'object' || !config) throw new Error('Need to provide a config object');
	const logger = config.logger || config.console || false;
	if (typeof logger === 'object' && logger.log && logger.warn) {
		if (deleteFromConfig) {
			if (config.logger) delete config.logger;
			if (config.console) delete config.console;
		}
		return logger;
	}
	// if console param is truthy but not an object, then use default global console
	if (config.console && console) return console;
	// Default is to provide non-functional methods
	return { log: NOOP, warn: NOOP, error: NOOP, info: NOOP };
}

export default getLoggerFromConfig;
