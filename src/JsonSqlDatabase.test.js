import JsonSqlDatabase from './JsonSqlDatabase.js';

test('Can instantiate a new JsonSqlDatabase object', () => {
	expect(typeof new JsonSqlDatabase()).toBe('object');
});
