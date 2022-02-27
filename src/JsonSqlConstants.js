const DEFAULT_SIZE = 255;
const DEFAULT_DATATYPE = `VARCHAR(${DEFAULT_SIZE})`;

// Internal formatting constants
const FORMATTING = Object.freeze({
	BOOLEAN: 'bool',
	PLAIN: 'plain',
	STRING: 'str',
	BINARY: 'bin',
});
// Mapping of SQL datatypes to the internal formatting type used for values
const SQL_DATATYPE_VALUE_FORMATTING = Object.freeze({
	BOOLEAN: FORMATTING.BOOLEAN,
	TINYIT: FORMATTING.PLAIN,
	INT: FORMATTING.PLAIN, // integer
	INTEGER: FORMATTING.PLAIN,
	SMALLINT: FORMATTING.PLAIN,
	DECIMAL: FORMATTING.PLAIN,
	NUMERIC: FORMATTING.PLAIN,
	BIT: FORMATTING.PLAIN,
	FLOAT: FORMATTING.PLAIN,
	REAL: FORMATTING.PLAIN, // double_precision
	DOUBLE: FORMATTING.PLAIN, // double_precision
	DOUBLE_PRECISION: FORMATTING.PLAIN,
	DEC: FORMATTING.PLAIN, // decimal
	FIXED: FORMATTING.PLAIN, // decimal
	CHAR: FORMATTING.STRING,
	VARCHAR: FORMATTING.STRING,
	TINYTEXT: FORMATTING.STRING,
	TEXT: FORMATTING.STRING,
	MEDIUMTEXT: FORMATTING.STRING,
	LONGTEXT: FORMATTING.STRING,
	TINYBLOB: FORMATTING.BINARY, // 255 bytes
	BLOB: FORMATTING.BINARY, // 64 KB
	MEDIUMBLOB: FORMATTING.BINARY, // 16 MB
	LONGBLOB: FORMATTING.BINARY, // 4 GB
	BINARY: FORMATTING.BINARY,
	VARBINARY: FORMATTING.BINARY,
	// TODO: handle other data types differently:
	// JSON - https://dev.mysql.com/doc/refman/8.0/en/json.html
	// spatial? - https://dev.mysql.com/doc/refman/8.0/en/spatial-types.html
	// ENUM, SET - https://dev.mysql.com/doc/refman/8.0/en/string-types.html
	// DATE, TIME, DATETIME, TIMESTAMP, YEAR - https://dev.mysql.com/doc/refman/8.0/en/date-and-time-types.html
});

export {
	DEFAULT_SIZE,
	DEFAULT_DATATYPE,
	FORMATTING,
	SQL_DATATYPE_VALUE_FORMATTING,
};
