import JsonSqlUtils from './JsonSqlUtils.js';

class JsonSqlValidator {
	/** Mutate 1st error array provided to concat 2nd error array */
	static addErrors(destinationErrorArray = [], newErrors) {
		if (!newErrors || !(newErrors instanceof Array)) return destinationErrorArray;
		destinationErrorArray.push(...newErrors);
		return destinationErrorArray;
	}

	/**
	 * Validate a value to see if it's valid as a foreign key
	 * (formatted like 'ref_table(ref_key)')
	 */
	static validateForeignKey(value, foreignKey, tables) {
		const fkErrors = [];
		const validValues = JsonSqlUtils.getForeignKeyValidValues(foreignKey, tables);
		const valueFound = validValues.includes(value);
		if (!valueFound) {
			fkErrors.push(`Value ${value} not found as foreign key of ${foreignKey}`);
		}
		return fkErrors;
	}

	static validateColumnInsertData(colName, value, table = {}, tables = []) {
		const validationErrors = [];
		const col = JsonSqlUtils.findColumn(colName, table.columns);
		const tableName = table ? table.name : 'NO TABLE';
		if (!col) throw new Error(`Could not validate - no column ${colName} for table ${tableName}`);
		const {
			foreignKey, nullable, dataType, size, primaryKey, unique,
		} = col;
		// Check foreign key
		if (foreignKey) {
			const errors = JsonSqlValidator.validateForeignKey(value, foreignKey, tables);
			JsonSqlValidator.addErrors(validationErrors, errors);
		}
		// Check nullable
		if (value === null && !nullable) {
			validationErrors.push(`Null values are not allowed for column ${colName} on ${tableName}`);
		}
		// Check dataType
		if (dataType) {
			const formatting = JsonSqlUtils.getDataTypeFormatting(dataType);

			// TODO: Check dataTypes

			// Check size if appropriate
			if (JsonSqlUtils.isStringFormatting(formatting) && typeof size === 'number') {
				const len = String(value).length;
				if (len > size) {
					validationErrors.push(`Value (${value}) size ${len} longer than ${size} for ${colName} on ${tableName}`);
				}
			}
		}
		// Disabling unique check because this is incomplete, and it's not always practical to
		// have all rows of data in the table's data.
		// TODO: Get this working, but provide an option to toggle this check on/off
		/*
		if (primaryKey || unique) {
			if (!table.data) {
				validationErrors.push(`Missing table.data on ${tableName} so could not validate uniqueness for ${colName}`);
			}
			// TODO: If data exists in table, then check uniqueness / PK (conflict with existing values)
			// const errors = JsonSqlValidator.validateForeignKey(value, col.foreignKey, tables);
			// JsonSqlValidator.addErrors(validationErrors, errors);
		}
		*/
		return validationErrors;
	}

	/** Validate an object of data meant to mimic the table */
	static validateTableInsertData(tableInsertData = {}, table = {}, tables = []) {
		const validationErrors = [];
		Object.keys(tableInsertData).forEach((colName) => {
			const value = tableInsertData[colName];
			const errors = JsonSqlValidator.validateColumnInsertData(colName, value, table, tables);
			JsonSqlValidator.addErrors(validationErrors, errors);
		});
		return validationErrors;
	}

	/** Validate an object of data meant to mimic multiple tables */
	static validateTablesInsertData(tablesInsertData = {}, tables = []) {
		const dbDataErrors = [];
		Object.keys(tablesInsertData).forEach((tableName) => {
			const tableData = tablesInsertData[tableName];
			const table = JsonSqlUtils.findTable(tableName, tables);
			const errors = JsonSqlValidator.validateTableInsertData(tableData, table, tables);
			JsonSqlValidator.addErrors(dbDataErrors, errors);
		});
		return dbDataErrors;
	}
}

export default JsonSqlValidator;
