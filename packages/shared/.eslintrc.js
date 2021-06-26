module.exports = {
  "extends": [
    "@proton/eslint-config-proton"
  ],
  "parser": "@typescript-eslint/parser",
  "env": {
    "jasmine": true
  },
  "parserOptions": {
    "tsconfigRootDir": __dirname,
    "project": "./tsconfig.json"
  },
  "rules": {
    "import/no-unresolved": [
      "error",
      {
        "ignore": [
          "design-system"
        ]
      }
    ]
  },
  "ignorePatterns": [
    ".eslintrc.js"
  ]
}