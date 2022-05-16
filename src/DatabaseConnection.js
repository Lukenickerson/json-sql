/* eslint-disable no-await-in-loop */
// We want this to run queries synchronously
import mysql from 'mysql'; // https://github.com/mysqljs/mysql
import getLoggerFromConfig from './getLoggerFromConfig.js';

const DEFAULT_AUTO_CONNECT = true;

/** A wrapper for mysql, to allow for easy promise/async/await-based querying */
class DatabaseConnection {
	constructor(config = {}) {
		this.logger = getLoggerFromConfig(config);
		// Save the config because it should contain properties needed for connecting to mysql
		this.config = config;
		this.isConnected = false;
		this.mysqlConnection = null;
		// Should we create a connection? (Typically yes)
		const autoConnect = (typeof this.config.autoConnect === 'undefined') ? DEFAULT_AUTO_CONNECT : Boolean(this.config.autoConnect);
		if (autoConnect) this.createMySqlConnection();
	}

	getConnectionConfig() {
		// TODO: Maybe switch this to just pull out the value needed
		const config = { ...this.config };
		delete config.console;
		delete config.logger;
		return config;
	}

	createMySqlConnection() {
		const config = this.getConnectionConfig();
		this.logger.log(
			'Creating MySql connection', (config ? `${config.localAddress}:${config.port}` : ''),
		);
		this.mysqlConnection = mysql.createConnection(config);
		return this.mysqlConnection;
	}

	connectWithoutRetry() {
		return new Promise((resolve, reject) => {
			try {
				this.mysqlConnection.connect((error) => {
					if (error) reject(error);
					this.isConnected = true;
					resolve();
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	disconnect() {
		return new Promise((resolve, reject) => {
			try {
				this.mysqlConnection.end((error) => {
					if (error) reject(error);
					this.isConnected = false;
					resolve();
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	static wait(seconds = 0) {
		// console.log('Wait', seconds);
		return new Promise((resolve) => {
			setTimeout(resolve, seconds * 1000); // global
		});
	}

	async runQuery(sql, values) {
		// console.log('SQL: ', sql);
		if (!this.isConnected) {
			await this.connectWithoutRetry();
		}
		return this.runQueryWithoutConnect(sql, values);
	}

	runQueryWithoutConnect(sql, values) {
		return new Promise((resolve, reject) => {
			try {
				const queryCallback = (error, results, fields) => {
					// if (error) this.console.warn('\tSQL error:', error); // Would it be better to reject?
					// else console.log('SQL success');
					// console.log('\tSQL result:', results);
					resolve({ error, results, fields });
				};
				if (values) {
					this.mysqlConnection.query(sql, values, queryCallback);
				} else {
					this.mysqlConnection.query(sql, queryCallback);
				}
			} catch (err) {
				reject(err);
			}
		});
	}

	async runQueries(queries = []) {
		const results = [];
		for (let i = 0; i < queries.length; i += 1) {
			try {
				const result = await this.runQuery(queries[i]);
				results.push(result);
			} catch (error) {
				this.logger.warn(error);
				results.push({ error });
			}
		}
		return results;
	}

	async connect(retryCount = 0, waitSeconds = 1) {
		if (this.isConnected) return;
		for (let i = retryCount; i >= 0; i -= 1) {
			this.logger.log('Connect attempt - countdown from', i);
			try {
				await this.connectWithoutRetry();
				return; // Success!
			} catch (err) {
				// Because we "cannot enqueue handshake after fatal error" we need
				// to recreate the MySql connection
				this.createMySqlConnection();
				// this.logger.warn('\tCheck - connection failed or other error', err);
			}
			await DatabaseConnection.wait(waitSeconds);
		}
		throw new Error('Connection failed');
	}

	async check(retryCount = 1, waitSeconds = 1) {
		if (retryCount <= 0) return false;
		// await this.connect();
		for (let i = retryCount; i > 0; i -= 1) {
			this.logger.log('Check', i);
			try {
				await this.connect();
				const { error } = await this.runQuery('show databases'); // 'SELECT 1 + 1 AS solution');
				// await this.disconnect();
				if (!error) {
					this.logger.log('\tCheck - Connected and test query was successful');
					// this.disconnect();
					return true;
				}
				this.logger.warn('\tCheck - test query failed');
			} catch (err) {
				this.logger.warn('\tCheck - connection failed or other error', err);
			}
			await DatabaseConnection.wait(waitSeconds);
		}
		// this.disconnect();
		return false;
	}
}

export default DatabaseConnection;
