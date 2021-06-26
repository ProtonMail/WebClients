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
    "jsx-a11y/click-events-have-key-events": "off"
  },
  "ignorePatterns": [
    ".eslintrc.js"
  ]
}