# JSON-SQL - ORM for creating SQL from JSON

## How to use

```js
// Import the classes (ESM/module style)
import {
	JsonSqlUtils,
	JsonSqlConverter,
	JsonSqlDatabase,
	JsonSqlMarkdown,
	JsonSqlValidator,
	JsonSqlValidatorDatabase,
} from 'json-sql';
```

Tables are defined as objects with a `name`, `columns` array, and optionally a `data` array (especially useful for reference tables), and a `notes` string.

```js
// Define your database tables with "json" data
const accountTypesTable = {
	name: 'account_type',
	notes: 'User account types', // for documentation only
	columns: [
		{
			name: 'account_type_key',
			dataType: 'VARCHAR',
			size: 1,
			primaryKey: true,
		},
		// etc.
	],
	data: [
		['A'],
		['B'],
		['C'],
	],
};
const accountTable = {
	name: 'account',
	notes: 'User accounts',
	columns: [
		{
			name: 'account_id',
			dataType: 'INTEGER',
			autoIncrement: true,
			primaryKey: true,
		},
		{
			name: 'account_name',
			dataType: 'VARCHAR',
			size: 100,
		},
		{
			name: 'account_type_key',
			dataType: 'VARCHAR',
			size: 1,
			foreignKey: 'account_type(account_type_key)',
		}
		// etc.
	],
	data: [
		[1, 'test', 'A']
	],
};
const tables = [accountTypesTable, accountTable]; // order is important when there are foreign keys
```

Convert your JSON-defined tables into valid SQL with `JsonSqlConverter`.

```js
const makeAccountTableSql = JsonSqlConverter.makeCreateTableSql(accountTable);
const selectSql = JsonSqlConvert.makeSelectSql(accountTable, ['account_id'], { account_name: 'test' });
// (Also makeInsertRecordIntoSql, makeInsertIntoSql, makeUpdateSql)
```

Need some quick documentation of your database? Use `JsonSqlMarkdown` to make a document of your database.

```js
const md = JsonSqlMarkdown.makeTablesMarkdown(tables);
```

You can also connect to a database, set it up easily based on your table data, and query with async/await methods.
See https://github.com/mysqljs/mysql#connection-options for connection options.

```js
// Create database connection
const dbOptions = {
	host: 'localhost',
	port: 3306,
	user: 'jlpicard',
	password: 'earlgrey2347vintage',
};
const db = new JsonSqlDatabase('my_db', tables, dbOptions);
// Create the database, populate with all tables, and all initial data
await db.setup();

// Typical process is to connect, do some database work, then disconnect
await db.connect();
await db.insert('account', { account_name: 'worf', account_type_key: 'B' });
// (Also db.select and db.update)
await db.disconnect();
```

## Dependencies
- https://github.com/mysqljs/mysql (only for `JsonSqlDatabase`)
- Developed on Node v16.14.0

## Current Limitations
* SQL injection is possible if you use untrusted SQL with the `select`, `update`, or `query` methods.
* Not all data types are handled.
* Not all SQL options/commands are possible.

Want to add something? Make a PR.

## Future Improvement
- [ ] Allow named constraints
- [ ] Clean up validation code
- [ ] Consider renaming this project, and using some functionality of identically named [json-sql](https://github.com/2do2go/json-sql)
- [ ] Better documentation of all params, methods
- [ ] MariaDb container for testing database connection
- [ ] Handling of all data types
- [ ] Unit testing
