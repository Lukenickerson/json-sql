const isWindows = (process.platform === 'win32');
const linebreakStyle = (isWindows ? "windows" : "unix");

module.exports = {
	// For an explanation and eaxmples of all rules, see https://github.com/airbnb/javascript#table-of-contents
	"extends": "airbnb-base",
	"plugins": ["jest"], // Handle jest globals
	"env": {
		"browser": true,
		"jest/globals": true
	},
	"ignorePatterns": ["dist/*"],
	"globals": {
		// "window": "readonly",
	},
	"rules": {
		"indent": ["error", "tab"],
		"no-tabs": ["error", { "allowIndentationTabs": true }],
		// Linebreak style needs to be updated based on environment
		"linebreak-style": ["error", linebreakStyle],
		"import/extensions": ["warn", "always"],
		"arrow-body-style": ["warn", "as-needed"],
		"no-use-before-define": ["warn", { "functions": true, "classes": true }],
		"no-console": ["warn", { allow: ["warn", "error"] }],
		// "max-len": ["error", { "ignoreTrailingComments": true }],
	}
};
