import DatabaseConnection from './DatabaseConnection.js';
import JsonSqlUtils from './JsonSqlUtils.js';
import JsonSqlConverter from './JsonSqlConverter.js';
import getLoggerFromConfig from './getLoggerFromConfig.js';


class JsonSqlDatabase {
	constructor(name, tables = [], connectionConfigParam = {}) {
		this.name = name;
		this.tables = tables;
		this.logger = getLoggerFromConfig(connectionConfigParam, false);
		this.connectionConfig = {
			database: this.name,
			...connectionConfigParam,
		};
		this.connection = new DatabaseConnection(this.connectionConfig);
	}

	getTables() {
		return this.tables;
	}

	findTable(tableName) {
		return JsonSqlUtils.findTable(tableName, this.tables);
	}

	async connect() {
		this.logger.log(this.name, 'connecting');
		await this.connection.connect(30, 2);
	}

	async disconnect() {
		this.logger.log(this.name, 'disconnecting');
		await this.connection.disconnect();
	}

	insert(tableName, data) {
		const table = this.findTable(tableName);
		const insertSql = JsonSqlConverter.makeInsertIntoSql(table, data, { placeholder: '?' });
		const values = JsonSqlConverter.getOrderedValuesArray(table, data);
		return this.query(insertSql, values);
	}

	select(tableName, fieldNames = [], where) {
		const table = this.findTable(tableName);
		const sql = JsonSqlConverter.makeSelectSql(table, fieldNames, where);
		return this.query(sql);
	}

	update(tableName, setData, where) {
		const table = this.findTable(tableName);
		const sql = JsonSqlConverter.makeUpdateSql(table, setData, where, { placeholder: '?' });
		const values = JsonSqlConverter.getOrderedValuesArray(table, setData);
		return this.query(sql, values);
	}

	upsert(tableName, data) {
		const table = this.findTable(tableName);
		const options = { placeholder: '?', onDuplicateKeyUpdate: true };
		const insertSql = JsonSqlConverter.makeInsertIntoSql(table, data, options);
		const values = JsonSqlConverter.getOrderedValuesArray(table, data);
		// Need the values twice because we're using onDuplicateKeyUpdate
		const valuesTwice = [...values, ...values];
		return this.query(insertSql, valuesTwice);
	}

	query(sql, values) {
		this.logger.log(`Querying ${this.name}:`, sql, values);
		return this.connection.runQuery(sql, values);
	}

	/** Get primary key for a table; assumes there is only one; will return the last one found */
	getTablePrimaryKey(tableName) {
		const table = this.findTable(tableName);
		if (!table) return null;
		const pk = table.columns.reduce((n, col) => (col.primaryKey ? col.name : n), null);
		return pk;
	}

	findUniqueColumns(tableName, uniqueConstraintName) {
		const table = this.findTable(tableName);
		if (!table) return null;
		return table.columns.filter((col) => (col.unique === uniqueConstraintName));
	}

	findUniqueColumnNames(tableName, uniqueConstraintName) {
		const cols = this.findUniqueColumns(tableName, uniqueConstraintName);
		if (!cols) return null;
		return cols.map((col) => (col.name));
	}

	// Setup

	createSetupQueries() {
		const tablesSql = this.tables.map((table) => JsonSqlConverter.makeCreateTableSql(table));
		const insertSql = this.tables
			.filter((table) => table.data)
			.map((table) => JsonSqlConverter.makeInsertIntoSql(table));
		return [
			// 'SELECT 1 + 1 AS solution',
			`DROP DATABASE IF EXISTS ${this.name}`,
			`CREATE DATABASE ${this.name}`,
			// 'show databases',
			`USE ${this.name}`,
			...tablesSql,
			...insertSql,
		];
	}

	async setup() {
		// Make a connection without the database name because it
		// likely does not exist yet
		const connectionConfig = {
			...this.connectionConfig,
			database: null,
		};
		this.connection = new DatabaseConnection(connectionConfig);
		await this.connect();
		const queries = this.createSetupQueries();
		this.logger.log(`Running setup queries on ${this.name}:`, queries);
		const results = await this.connection.runQueries(queries);
		const errorCount = results
			// .filter((r) => r.error)
			.reduce((sum, r) => (sum + (r.error ? 1 : 0)), 0);
		await this.disconnect();
		return { errorCount, results, queryCount: queries.length };
	}
}

export default JsonSqlDatabase;
