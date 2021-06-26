# Proton I18N

A CLI to manage translations
    - validation
    - extraction
    - sync with crowdin

We use [ttag](https://github.com/ttag-org/ttag) for our React projects and [angular-gettext](https://github.com/rubenv/angular-gettext) for our [WebClient](https://github.com/ProtonMail/WebClient).


## How to install ?

```sh
$ npm i -D github:ProtonMail/proton-i18n.git#semver:^1.0.0
``` 

## Commands
```sh
$ npx proton-i18n help
Usage: $ proton-i18n <command>
Available commands:
  - crowdin
      To update, download etc. translations (--help to get more details)

  - validate <type>
      To validate the translations, check if we have contexts
        - type: default (default) validate we don't have missing context
        - type: lint-functions check if we use the right format for ttag

  - extract <type>
      Extract all translations from the projet
      - type: default (app) extract translations from the app and reactComponents + shared
      - type: reactComponents extract only translations from react-components
      - type: shared extract only translations from proton-shared

  - list <type>
      List all translations available
        - type: default (default) write them inside a file po/lang.json
        - type: show print JSON inside the console

  - compile
      Compile all translations from the dir ./po to a JSON inside src/i18n/<lang>.json

  - commit <type>
      Commit translations
      - type: update commit new extracted translations
      - type: upgrade commit new translations (po, json)

  - upgrade <flag>
      Upgrade translations inside your app from the latest version available on crowdin.
      It will:
        - Get list of translations available
        - Upgrade our translations with ones from crowdin
        - Store a cache of translations available in the app
        - Export translations as JSON
        - Commit everything

      - flag: default none, it will auto fetch latest translations (proton-i18n crowdin --list --type --limit=95)
      - flag: --custom it will use your version of the file
      - flag: --limit-i18n Custom limit to extract the list of translations available. Default 90.
``` 

### Validate

```sh
$ proton-i18n validate
``` 

> Output errors in translation if we don't find a context for one or many translatins.

```sh
$ proton-i18n validate --lint
``` 

> For the CI, reject if there is at least one missing context


## How to setup ?

You need to have a file `.env` inside the directory `<project>/env/`.
```sh
I18N_DEPENDENCY_REPO=<REPOSITORY WITH TRANSLATIONS>
I18N_DEPENDENCY_BRANCH=<BRANCH FOR THE TRANSLATIONS>
CROWDIN_KEY_API=<API-KEY>
CROWDIN_PROJECT_NAME=<CROWDIN-PROJECT-NAME>
CROWDIN_FILE_NAME='<FILE NAME AVAILABLE ON CROWDIN>' // ex: ProtonVPN Settings Website.pot
I18N_TEMPLATE_FILE:<FILE SOURCE TO UPLOAD TO CROWDIN>
``` 

You don't need these key if you don't manage crowdin, for extraction and validation we won't need them.

- `I18N_TEMPLATE_FILE`: Default value -> `template.pot`

> We need this key to detect the project as we require some custom code for it.


## Tests

### Update test linter

Add a use case inside `test/js` then run `./test/run.sh generate`
