# Proton Lint

Modern eslint config for a more civilized age

## Install

```
npm i https://github.com/ProtonMail/proton-lint.git eslint@7.3.1 --save-dev
```

Then, put this in .eslintrc in your project:

```
module.exports = {
  extends: ['proton-lint'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
```
