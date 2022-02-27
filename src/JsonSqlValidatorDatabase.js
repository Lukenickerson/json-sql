import JsonSqlUtils from './JsonSqlUtils.js';
import JsonSqlDatabase from './JsonSqlDatabase.js';
import JsonSqlValidator from './JsonSqlValidator.js';

class JsonSqlValidatorDatabase extends JsonSqlDatabase {
	constructor(name, tables = [], connectionConfigParam = {}) {
		super(name, tables, connectionConfigParam);
	}

	validateInsert(value, destinationTable, destinationColumn) {
		const table = JsonSqlUtils.findTable(destinationTable);
		const tables = this.getTables();
		const errors = JsonSqlValidator.validateColumnInsertData(
			destinationColumn, value, table, tables,
		);
		return errors;
	}

	validateInsertData(tablesInsertData = {}) {
		const tables = this.getTables();
		return JsonSqlValidator.validateTablesInsertData(tablesInsertData, tables);
	}
}

export default JsonSqlValidatorDatabase;
