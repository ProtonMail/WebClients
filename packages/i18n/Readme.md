# Proton I18N

A CLI to manage translations - validation - extraction

We use [ttag](https://github.com/ttag-org/ttag) for our React projects and [angular-gettext](https://github.com/rubenv/angular-gettext) for our [WebClient](https://github.com/ProtonMail/WebClient).

## Commands

```sh
$ npx proton-i18n help
Usage: $ proton-i18n <command>
Available commands:
  - validate <type>
      To validate the translations, check if we have contexts
        - type: default (default) validate we don't have missing context
        - type: lint-functions check if we use the right format for ttag

  - extract <type>
      Extract all translations from the projet
      - type: default (app) extract translations from the app and reactComponents + shared
      - type: reactComponents extract only translations from react-components
      - type: shared extract only translations from proton-shared
```

## How to setup ?

You need to have a file `.env` inside the directory `<project>/env/`.

```sh
I18N_TEMPLATE_FILE:<FILE SOURCE TO UPLOAD TO CROWDIN>
```

You don't need these key if you don't manage crowdin, for extraction and validation we won't need them.

-   `I18N_TEMPLATE_FILE`: Default value -> `po/template.pot`

> We need this key to detect the project as we require some custom code for it.

## Tests

`$ npm test`
