import { DEFAULT_SIZE, DEFAULT_DATATYPE } from './JsonSqlConstants.js';
import JsonSqlUtils from './JsonSqlUtils.js';

const COMMA = ', ';

/** Methods for converting JSON db configuration to SQL statements */
class JsonSqlConverter {
	// constructor() {
	// }

	// Other

	static getColumnDataType(col) {
		if (col.dataType === 'VARCHAR' || col.dataType === 'CHAR') {
			const size = (typeof col.size === 'number') ? col.size : DEFAULT_SIZE;
			return `${col.dataType}(${size})`;
		}
		return col.dataType || DEFAULT_DATATYPE;
	}

	static getInsertValueSql(value, dataType) {
		if (value === undefined) throw new Error('undefined is invalid value for insert sql');
		if (value === null) return 'null';
		const formatting = JsonSqlUtils.getDataTypeFormatting(dataType);
		if (JsonSqlUtils.isPlainFormatting(formatting)) {
			return String(value);
		}
		if (JsonSqlUtils.isStringFormatting(formatting)) {
			// Strings need to be wrapped in single quotes and have single quotes escaped
			return `'${value.replaceAll("'", "\\'")}'`;
		}
		if (JsonSqlUtils.isBooleanFormatting(formatting)) {
			// Allow true and false to convert to 1 and 0 respectively
			if (value === true) return '1';
			if (value === false) return '0';
			const str = String(value).trim();
			// But don't allow any other type conversions
			if (str !== '0' && str !== '1') throw new Error('Incorrect value for boolean - needs to be true, false, 0, 1');
			return str;
		}
		if (JsonSqlUtils.isBinaryFormatting(formatting)) {
			return `BINARY(${value})`;
		}
		console.warn('Unknown formatting', value, dataType);
		return String(value);
	}

	static getOrderedValuesArray(table = {}, record = {}) {
		const values = [];
		table.columns.forEach((col) => {
			const value = record[col.name];
			if (value === undefined) return;
			values.push(value);
		});
		return values;
	}

	static getOrderedColumnNamesArray(table = {}, record = {}) {
		const colNames = [];
		table.columns.forEach((col) => {
			const value = record[col.name];
			if (value === undefined) return;
			colNames.push(col.name);
		});
		return colNames;
	}

	static getOrderedSqlArrays(table = {}, record = {}, options = {}) {
		const columnNames = JsonSqlConverter.getOrderedColumnNamesArray(table, record);
		// ^ Don't want to use Object.keys(record); because then the order is indeterminate
		// This will contain the sql-ready values in the same order as the columnsNamesUsing
		const sqlValues = columnNames.map((columnName) => {
			const foundCol = table.columns.find((col) => col.name === columnName);
			// If there's an invalid property/column name in the record, throws an error
			if (!foundCol) throw new Error(`Column ${columnName} not found, so not including in INSERT.`);
			if (options.placeholder) return options.placeholder;
			const ogValue = record[columnName];
			return JsonSqlConverter.getInsertValueSql(ogValue, foundCol.dataType);
		});
		return { columnNames, sqlValues };
	}

	// ---------- Make SQL

	static makeCreateTableColumnsSql(columns = []) {
		const keyLines = []; // Primary and foreign keys
		const columnLines = columns.map((col) => {
			const lineComponents = [
				col.name,
				JsonSqlConverter.getColumnDataType(col),
			];
			if (col.sql) lineComponents.push(col.sql);
			if (!col.nullable) lineComponents.push('NOT NULL');
			if (col.autoIncrement) lineComponents.push('AUTO_INCREMENT');
			if (col.unique) lineComponents.push('UNIQUE');
			if (col.primaryKey) {
				lineComponents.push('PRIMARY KEY');
				// keyLines.push(`PRIMARY KEY (${col.name})`);
			}
			if (col.foreignKey) {
				keyLines.push(`FOREIGN KEY (${col.name}) REFERENCES ${col.foreignKey}`);
			}
			if (col.defaultValue) {
				const defaultValue = JsonSqlConverter.getInsertValueSql(col.defaultValue, col.dataType);
				lineComponents.push(`DEFAULT ${defaultValue}`);
			}
			return lineComponents.join(' ');
		});
		return [
			...columnLines, ...keyLines,
		].join(COMMA);
	}

	static makeCreateTableSql(table) {
		return `CREATE TABLE ${table.name} (${JsonSqlConverter.makeCreateTableColumnsSql(table.columns)})`;
	}

	static makeWhereSql(whereObj = {}, table = {}) {
		if (typeof whereObj === 'string') return whereObj;
		const { columns } = table;
		const fieldNames = Object.keys(whereObj);
		if (fieldNames.length === 0) return '0=1';
		const whereArray = fieldNames.map((fieldName) => {
			const col = JsonSqlUtils.findColumn(fieldName, columns);
			const { dataType } = col;
			// const dataType = JsonSqlConverter.getColumnDataType(col);
			const value = JsonSqlConverter.getInsertValueSql(whereObj[fieldName], dataType);
			if (String(value).toLowerCase === 'null') return `${fieldName} IS NULL`;
			return `${fieldName} = ${value}`;
		});
		return whereArray.join(' AND ');
	}

	static makeSelectSql(table = {}, fieldNames = [], where = '1=1') {
		const fieldsSql = (typeof fieldNames === 'string') ? fieldNames : fieldNames.join(COMMA);
		const whereSql = JsonSqlConverter.makeWhereSql(where, table);
		return `SELECT ${fieldsSql} FROM ${table.name} WHERE ${whereSql}`;
	}

	static makeInsertRecordIntoSql(table = {}, record = {}, options = {}) {
		const { columnNames, sqlValues } = JsonSqlConverter.getOrderedSqlArrays(table, record, options);
		const columnNamesCsv = columnNames.join(COMMA);
		return `INSERT INTO ${table.name} (${columnNamesCsv}) VALUES (${sqlValues.join(COMMA)})`;
	}

	static makeInsertIntoSql(table = {}, dataParam, options = {}) {
		if (typeof dataParam === 'object' && !(dataParam instanceof Array)) {
			return JsonSqlConverter.makeInsertRecordIntoSql(table, dataParam, options);
		}
		const data = (!dataParam && table.data) ? table.data : dataParam;
		const columnNamesCsv = table.columns.map((col) => col.name).join(COMMA);
		const allValuesCsv = data.map((dataRow) => {
			const rowValuesCsv = dataRow.map((ogValue, i) => {
				if (options.placeholder) return options.placeholder;
				const colField = table.columns[i];
				return JsonSqlConverter.getInsertValueSql(ogValue, colField.dataType);
			}).join(COMMA);
			return `(${rowValuesCsv})`;
		}).join(COMMA);
		return `INSERT INTO ${table.name} (${columnNamesCsv}) VALUES ${allValuesCsv}`;
	}

	static makeUpdateSql(table = {}, setData = {}, where, options = {}) {
		const { columnNames, sqlValues } = JsonSqlConverter.getOrderedSqlArrays(
			table, setData, options,
		);
		const sqlSets = columnNames.map((columnName, i) => (
			`${columnName} = ${sqlValues[i]}`
		));
		const whereSql = JsonSqlConverter.makeWhereSql(where, table);
		return `UPDATE ${table.name} SET ${sqlSets.join(COMMA)} WHERE ${whereSql}`;
	}
}

export default JsonSqlConverter;
