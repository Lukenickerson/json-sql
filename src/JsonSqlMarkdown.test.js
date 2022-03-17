import JsonSqlMarkdown from './JsonSqlMarkdown.js';

// test('JsonSqlMarkdown instantiates an object', () => {
// const jsm = new JsonSqlMarkdown();
// expect(typeof jsm).toBe('object');
// });

test('makeTablesMarkdown creates mostly empty markdown with no params', () => {
	const md = JsonSqlMarkdown.makeTablesMarkdown();
	expect(md).toBe('# Tables');
});

const testTable = {
	name: 'table1',
	columns: [
		{ name: 'col1' },
		{ name: 'col2' },
	],
};

test('makeTablesMarkdown returns basic markdown for one, simple test table', () => {
	const md = JsonSqlMarkdown.makeTablesMarkdown([testTable]);
	expect(md).toBe('# Tables\n\n## table1\n- `col1` - Unspecified data type | required\n- `col2` - Unspecified data type | required\n');
});
