import { DEFAULT_SIZE, DEFAULT_DATATYPE } from './JsonSqlConstants.js';
import JsonSqlUtils from './JsonSqlUtils.js';

const COMMA = ', ';

/** Methods for converting JSON db configuration to SQL statements */
class JsonSqlConverter {
	// constructor() {
	// }

	// Other

	static getColumnDataType(col) {
		if (col.dataType === 'VARCHAR' || col.dataType === 'CHAR'
			|| (col.dataType === 'BINARY' && col.size)
		) {
			const size = (typeof col.size === 'number') ? col.size : DEFAULT_SIZE;
			return `${col.dataType}(${size})`;
		}
		return col.dataType || DEFAULT_DATATYPE;
	}

	static getInsertValueSql(value, dataType) {
		if (value === undefined) throw new Error('undefined is invalid value for insert sql');
		if (value === null) return 'null';
		const formatting = JsonSqlUtils.getDataTypeFormatting(dataType);
		const str = String(value).trim();
		if (JsonSqlUtils.isPlainFormatting(formatting)) {
			return str;
		}
		if (JsonSqlUtils.isStringFormatting(formatting)) {
			// Strings need to be wrapped in single quotes and have single quotes escaped
			return `'${value.replaceAll("'", "\\'")}'`;
		}
		if (JsonSqlUtils.isBooleanFormatting(formatting)) {
			// Allow true and false to convert to 1 and 0 respectively
			if (value === true) return '1';
			if (value === false) return '0';
			// But don't allow any other type conversions
			if (str !== '0' && str !== '1') throw new Error('Incorrect value for boolean - needs to be true, false, 0, 1');
			return str;
		}
		if (JsonSqlUtils.isBinaryFormatting(formatting)) {
			// This should capture things like "0x010203040506" and "UUID_TO_BIN(UUID())"
			if (str.substring(0, 2) === '0x'
				|| str.substring(0, 11).toUpperCase() === 'UUID_TO_BIN'
			) {
				return str;
			}
			return `BINARY(${str})`;
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

	/** Makes an object like: { "constraint_name": ["field_1", "field_2"] } */
	static getUniqueConstraints(columns = []) {
		return columns.reduce((incomingObj, col) => {
			const isUniqueConstraint = (col.unique && typeof col.unique === 'string');
			const obj = { ...incomingObj };
			if (!isUniqueConstraint) return obj;
			// Should we remove spaces from col.unique?
			if (!obj[col.unique]) obj[col.unique] = [];
			obj[col.unique].push(col.name);
			return obj;
		}, {});
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
			// Check that unique is true, but not a string; if it's a string then it'll be a
			// different kind of uniqueness constraint
			if (col.unique && typeof col.unique !== 'string') lineComponents.push('UNIQUE');
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

	/** Meant to be used during CREATE, but could also be used during ALTER TABLE by adding 'ADD' */
	static makeCreateTableConstraintsSqlArray(columns = []) {
		const uConstraints = JsonSqlConverter.getUniqueConstraints(columns);
		return Object.keys(uConstraints).map((uConstraintKey) => {
			// This assumes col.unique (aka. uConstraintKey) has no spaces
			const fieldsArr = uConstraints[uConstraintKey];
			return `CONSTRAINT ${uConstraintKey} UNIQUE (${fieldsArr.join(COMMA)})`;
		});
	}

	static makeCreateTableSql(table) {
		let colsSql = JsonSqlConverter.makeCreateTableColumnsSql(table.columns);
		const constraintSqlArr = JsonSqlConverter.makeCreateTableConstraintsSqlArray(table.columns);
		if (constraintSqlArr.length) {
			colsSql += `, ${constraintSqlArr.join(COMMA)}`;
		}
		return `CREATE TABLE ${table.name} (${colsSql})`;
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
			if (String(value).toLowerCase() === 'null') return `${fieldName} IS NULL`;
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
		const sql = `INSERT INTO ${table.name} (${columnNamesCsv}) VALUES (${sqlValues.join(COMMA)})`;
		if (!options.onDuplicateKeyUpdate) return sql;
		const setsSql = JsonSqlConverter.makeUpateSetsSql(columnNames, sqlValues);
		return `${sql} ON DUPLICATE KEY UPDATE ${setsSql}`;
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

	static makeUpateSetsSql(columnNames, sqlValues) {
		const sqlSets = columnNames.map((columnName, i) => (
			`${columnName} = ${sqlValues[i]}`
		));
		return sqlSets.join(COMMA);
	}

	static makeUpdateSql(table = {}, setData = {}, where, options = {}) {
		const { columnNames, sqlValues } = JsonSqlConverter.getOrderedSqlArrays(
			table, setData, options,
		);
		const setsSql = JsonSqlConverter.makeUpateSetsSql(columnNames, sqlValues);
		const whereSql = JsonSqlConverter.makeWhereSql(where, table);
		return `UPDATE ${table.name} SET ${setsSql} WHERE ${whereSql}`;
	}
}

export default JsonSqlConverter;
