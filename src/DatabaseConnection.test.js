import DatabaseConnection from './DatabaseConnection.js';

test('Can instantiate a new DatabaseConnection object', () => {
	expect(typeof new DatabaseConnection()).toBe('object');
});
