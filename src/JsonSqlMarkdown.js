const BR = '\n'; // Linebreak

class JsonSqlMarkdown {
	// constructor() {
	// }

	static getFriendlyDataType(col = {}) {
		if (!col.dataType) return 'Unspecified data type';
		if (col.dataType === 'CHAR' && col.size === 1) return 'one letter';
		const friendlyMap = {
			VARCHAR: 'text',
			CHAR: 'text',
			INT: 'integer',
			BOOLEAN: 'boolean',
		};
		return friendlyMap[col.dataType] || col.dataType;
	}

	static getFriendlyForeignKey(col = {}) {
		if (!col.foreignKey) return null;
		try {
			const fkParts = col.foreignKey.split(')')[0].split('(');
			return `FK linked to ${fkParts[0]} table (${fkParts[1]})`;
		} catch (err) {
			console.warn(err);
		}
		return 'FK unknown';
	}

	static makeTableColumnsMarkdown(columns = []) {
		return columns.map((col) => {
			const lineComponents = [
				col.notes,
				JsonSqlMarkdown.getFriendlyDataType(col),
				(col.primaryKey ? 'PK (Must be unique)' : null),
				JsonSqlMarkdown.getFriendlyForeignKey(col),
				(col.nullable ? 'null allowed' : 'required'),
				(col.unique ? 'must be unique' : null),
				(col.autoIncrement ? 'auto-increment' : null),
				(col.defaultValue ? `default: ${col.defaultValue}` : null),
			];
			const lineComponentsString = lineComponents.filter((c) => c).join(' | ');
			return `- \`${col.name}\` - ${lineComponentsString}`;
		}).join(BR);
	}

	static makeDataTableHeaderMarkdown(columns) {
		const colMarkdown = `| ${columns.map((col) => col.name).join(' | ')} |`;
		const separatorMarkdown = `| ${columns.map(() => '---').join(' | ')} |`;
		return `${BR}${colMarkdown}${BR}${separatorMarkdown}${BR}`;
	}

	static getSampleData(data = [], sampling = []) {
		const [rowsStart = 5, rowsEnd = 5] = sampling;
		if (data.length <= rowsStart + rowsEnd) return [...data];
		return [
			...data.slice(0, rowsStart),
			...data.slice(data.length - rowsEnd),
		];
	}

	/*
	| my_id | my_text |
	|---|---|
	| 1 | hello |
	*/
	static makeDataTableMarkdown(table, sampling) {
		const { data, columns } = table;
		if (!data) return null;
		const sampleData = JsonSqlMarkdown.getSampleData(data, sampling);
		const dataMarkdownArr = sampleData.map(
			(dataRowArr) => (`| ${dataRowArr.join(' | ')} |`),
		);
		return JsonSqlMarkdown.makeDataTableHeaderMarkdown(columns) + [
			...dataMarkdownArr,
		].join(BR) + BR;
	}

	static makeTableMarkdown(table, options = {}, additionalRows = []) {
		const { sampling = [7, 5] } = options;
		const dataLength = (table.data ? table.data.length : 0);
		const sampleSize = sampling[0] + sampling[1];
		const isSample = (table.data && dataLength > sampleSize);
		const dataTitle = `### ${isSample ? `Sample of Initial Data (${sampleSize} rows out of ${dataLength})` : 'Initial Data'}`;
		return [
			`${BR}## ${table.name}`,
			table.notes,
			`${JsonSqlMarkdown.makeTableColumnsMarkdown(table.columns)}${BR}`,
			(table.data ? dataTitle : null),
			JsonSqlMarkdown.makeDataTableMarkdown(table, sampling),
			// options.showSql ? `SQL: \`${JsonSqlConverter.makeCreateTableSql(table)}\`` : '',
			...additionalRows,
		].filter((row) => row).join(BR);
	}
	// If you want to add in SQL, you could do something like:
	// makeTableMarkdown(table, {}, [`SQL: \`${JsonSqlConverter.makeCreateTableSql(table)}\``]);

	static makeTablesMarkdown(tables = [], options = {}) {
		const makeTableMarkdown = (table) => JsonSqlMarkdown.makeTableMarkdown(table, options);
		return [
			`# ${options.title || 'Tables'}`,
			...tables.map(makeTableMarkdown),
		].join(BR);
	}
}

export default JsonSqlMarkdown;
