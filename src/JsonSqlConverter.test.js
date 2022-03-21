import JsonSqlConverter from './JsonSqlConverter.js';

const CANDY_TABLE = {
	name: 'candy',
	columns: [
		{
			name: 'candy_key',
			dataType: 'VARCHAR',
			unique: true,
			size: 1,
		},
		{
			name: 'sweetness',
			dataType: 'INTEGER',
		},
		{
			name: 'brand',
			dataType: 'VARCHAR',
			unique: 'brandFlavorUniqueness',
		},
		{
			name: 'flavor_id',
			dataType: 'INTEGER',
			unique: 'brandFlavorUniqueness',
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

test('getUniqueConstraints returns object with property containing array', () => {
	const uniqueConstraints = JsonSqlConverter.getUniqueConstraints(CANDY_TABLE.columns);
	expect(typeof uniqueConstraints).toBe('object');
	expect(uniqueConstraints.brandFlavorUniqueness instanceof Array).toBe(true);
	expect(uniqueConstraints.brandFlavorUniqueness.length).toBe(2);
});

test('makeCreateTableSql', () => {
	const sql = JsonSqlConverter.makeCreateTableSql(CANDY_TABLE);
	expect(sql).toBe('CREATE TABLE candy (candy_key VARCHAR(1) NOT NULL UNIQUE, sweetness INTEGER NOT NULL, brand VARCHAR(255) NOT NULL, flavor_id INTEGER NOT NULL, CONSTRAINT brandFlavorUniqueness UNIQUE (brand, flavor_id))');
});
