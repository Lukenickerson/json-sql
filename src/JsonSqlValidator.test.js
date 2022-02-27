import JsonSqlValidator from './JsonSqlValidator.js';

const REF_TABLE = {
	name: 'ref',
	columns: [
		{
			name: 'ref_key',
			dataType: 'VARCHAR',
			size: 1,
		},
	],
	data: [
		['A'],
		['B'],
	],
};

const MAIN_TABLE = {
	name: 'main',
	columns: [
		{
			name: 'main_id',
			dataType: 'INT',
			autoIncrement: true,
		},
		{
			name: 'ref_key',
			dataType: 'VARCHAR',
			size: 1,
			foreignKey: 'ref(ref_key)',
		},
		{
			name: 'letter',
			dataType: 'VARCHAR',
			size: 1,
		},
	],
};
const TABLES = Object.freeze([REF_TABLE, MAIN_TABLE]);

test('Validating ref_key "B" has no errors', () => {
	const errors = JsonSqlValidator.validateForeignKey('B', 'ref(ref_key)', TABLES);
	expect(errors.length).toBe(0);
});

test('Validating ref_key "Z" has 1 error', () => {
	const errors = JsonSqlValidator.validateForeignKey('Z', 'ref(ref_key)', TABLES);
	expect(errors.length).toBe(1);
});

test('Validating ref_key 0 has 1 error', () => {
	const errors = JsonSqlValidator.validateForeignKey(0, 'ref(ref_key)', TABLES);
	expect(errors.length).toBe(1);
});

test('Validating ref_key null has 1 error', () => {
	const errors = JsonSqlValidator.validateForeignKey(null, 'ref(ref_key)', TABLES);
	expect(errors.length).toBe(1);
});

test('Validating inserting FK ref_key "B" into main has no errors', () => {
	const errors = JsonSqlValidator.validateColumnInsertData('ref_key', 'B', MAIN_TABLE, TABLES);
	expect(errors.length).toBe(0);
});

test('Validating inserting letter "AA" into main has 1 error', () => {
	// 'AA' should be too long
	const errors = JsonSqlValidator.validateColumnInsertData('letter', 'AA', MAIN_TABLE, TABLES);
	expect(errors.length).toBe(1);
});

test('Validating inserting FK ref_key "Z" into main has 1 error', () => {
	const errors = JsonSqlValidator.validateColumnInsertData('ref_key', 'Z', MAIN_TABLE, TABLES);
	expect(errors.length).toBe(1);
});

test('validateTableInsertData with good data gives no errors', () => {
	const goodInsertData = {
		ref_key: 'A',
		letter: 'a',
	};
	const errors = JsonSqlValidator.validateTableInsertData(goodInsertData, MAIN_TABLE, TABLES);
	expect(errors.length).toBe(0);
});

test('validateTableInsertData with some bad data re: ref_key gives 2 errors', () => {
	const badInsertData = {
		ref_key: 'ZZ', // No good (bad FK, too big)
		letter: 'z', // Good
	};
	const errors = JsonSqlValidator.validateTableInsertData(badInsertData, MAIN_TABLE, TABLES);
	expect(errors.length).toBe(2);
});

test('validateTableInsertData with all bad data gives 3 errors', () => {
	const badInsertData = {
		ref_key: 'ZZ', // No good
		letter: 'ZZ', // No good (too big)
	};
	const errors = JsonSqlValidator.validateTableInsertData(badInsertData, MAIN_TABLE, TABLES);
	expect(errors.length).toBe(3);
});
