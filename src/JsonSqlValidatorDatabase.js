import JsonSqlDatabase from './JsonSqlDatabase.js';
import JsonSqlValidator from './JsonSqlValidator.js';

class JsonSqlValidatorDatabase extends JsonSqlDatabase {
	constructor(name, tables = [], connectionConfigParam = {}) {
		super(name, tables, connectionConfigParam);
	}

	validateInsert(value, destinationTable, destinationColumn) {
		const table = this.findTable(destinationTable);
		if (!table) throw new Error(`Table ${destinationTable} could not be found in db`);
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
