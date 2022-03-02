import { SQL_DATATYPE_VALUE_FORMATTING, FORMATTING } from './JsonSqlConstants.js';

class JsonSqlUtils {
	static findTable(tableName, tables = []) {
		return tables.find((table) => table.name === tableName);
	}

	static findColumn(colName, columns = []) {
		return columns.find((col) => col.name === colName);
	}

	static getForeignKeyTableColumnNames(foreignKey) {
		const parts = foreignKey.split(')')[0].split('(');
		return { tableName: parts[0], columnName: parts[1] };
	}

	static getDataValues(table, colName) {
		const { data = [], columns = [] } = table;
		const colIndex = columns.findIndex((col) => col.name === colName);
		return data.map((row) => row[colIndex]);
	}

	static getForeignKeyValidValues(foreignKey, tables) {
		const { tableName, columnName } = JsonSqlUtils.getForeignKeyTableColumnNames(foreignKey);
		const fkTable = JsonSqlUtils.findTable(tableName, tables);
		return JsonSqlUtils.getDataValues(fkTable, columnName);
	}

	static getDataTypeFormatting(dataTypeParam) {
		const dataType = dataTypeParam.split('(')[0];
		return SQL_DATATYPE_VALUE_FORMATTING[dataType.toUpperCase()];
	}

	static isStringFormatting(formatting) {
		return (formatting === FORMATTING.STRING);
	}

	static isPlainFormatting(formatting) {
		return (formatting === FORMATTING.PLAIN);
	}

	static isBooleanFormatting(formatting) {
		return (formatting === FORMATTING.BOOLEAN);
	}

	static isBinaryFormatting(formatting) {
		return (formatting === FORMATTING.BINARY);
	}
}

export default JsonSqlUtils;
