import JsonSqlConverter from './JsonSqlConverter.js';

const CANDY_TABLE = {
	name: 'candy',
	columns: [
		{
			name: 'candy_key',
			dataType: 'VARCHAR',
			size: 1,
		},
		{
			name: 'sweetness',
			dataType: 'INTEGER',
		},
	],
};

test('getInsertValueSql converts "A" VARCHAR to \'A\' SQL', () => {
	const value = JsonSqlConverter.getInsertValueSql('A', 'VARCHAR');
	expect(value).toBe("'A'");
});

test('Make WHERE SQL correct when given an object', () => {
	const whereObj = {
		candy_key: 'A',
		sweetness: 1,
	};
	const sql = JsonSqlConverter.makeWhereSql(whereObj, CANDY_TABLE);
	expect(sql).toBe("candy_key = 'A' AND sweetness = 1");
});
