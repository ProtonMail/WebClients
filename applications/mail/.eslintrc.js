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
    "no-console": "off",
    "no-nested-ternary": "off",
    "import/no-cycle": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/no-noninteractive-element-interactions": "off",
    "jsx-a11y/click-events-have-key-events": "off"
  },
  "ignorePatterns": [
    ".eslintrc.js"
  ]
}