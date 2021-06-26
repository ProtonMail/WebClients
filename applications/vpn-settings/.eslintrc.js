module.exports = {
  "extends": [
    "@proton/eslint-config-proton"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "tsconfigRootDir": __dirname,
    "project": "./tsconfig.json"
  },
  "rules": {
    "react/forbid-prop-types": "warn",
    "react/no-array-index-key": "warn",
    "jsx-a11y/control-has-associated-label": "warn"
  },
  "ignorePatterns": [
    ".eslintrc.js"
  ]
}