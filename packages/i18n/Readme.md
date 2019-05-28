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


### Crowdin

```sh
$ proton-i18n crowdin <flag>
``` 

```sh
$ proton-i18n crowdin --help
Usage: $ proton-i18n crowdin <flag>
Available flags:
  - --sync|-s
      Update app's translations with the ones from crowdin.
      You can configure which translations you want to update by using a file i18n.txt.
      each translations (ex: fr) = one line.
      More informations on the Wiki
  - --update|-u
      Update crowdin with our export file from the app
  - --check|-c
      To check the progress of an export from crowdin (to know if it's done or not yet)
  - --export|-e
      Ask to crowdin to create an export of translations, as it needs some time to prepare them
  - --members|-m
      Get from crowdin the list of best contributors (top 30) for the project
      Flag: --format=top(default)/full
        top: list of top 30
        full: Object with top:List of top 30, byLang:{<lang>:<Array top contributors>}
  - --list|-l
      List translations available on crowdin sorted by most progress done.
      Usefull to export translations ex:

        $ proton-i18n crowdin --list --type
            only list the code of the translation

        $ proton-i18n crowdin --list --type --limit=95
            only list the code of the translation and limit progress >= 95 + approved >= 95

        $ proton-i18n crowdin --list --type --limit=95 --ignore-approved
            only list the code of the translation and limit progress >= 95
``` 


> :warning: `$ proton-i18n --members` takes several seconds as it needs to create an export then download the file.

## How to setup ?

You need to have a file `.env` inside the directory `<project>/env/`.
```sh
CROWDIN_KEY_API=<API-KEY>
CROWDIN_PROJECT_NAME=<CROWDIN-PROJECT-NAME>
CROWDIN_FILE_NAME='<FILE NAME>.pot'
I18N_EXTRACT_DIR:<OUTPUT DIR FOR POT FILE>
I18N_JSON_DIR:<OUTPUT DIR FOR TRANSLATED JSON>
``` 

You don't need these key if you don't manage crowdin, for extraction and validation we won't need them.

:warning: _If you work with the **WebClient** you must have a key inside the env_
```sh
APP_KEY=Angular
```

> We need this key to detect the project as we require some custom code for it.

### About I18N custom OUTPUT dir

You don't need to set the key, only if you want to change them.
- `I18N_EXTRACT_DIR`: Default value -> `po`
- `I18N_JSON_DIR`: Default value -> `src/i18n`

### Custom translations to update/add inside your app 

You will need to create the file `${I18N_EXTRACT_DIR}/i18n.txt`. It's a file listing translations you want to add inside the app. 

> default I18N_EXTRACT_DIR = po cf https://github.com/ProtonMail/proton-i18n#about-i18n-custom-output-dir
ex:
``` 
cs
de
es-ES
fr
id
it
ja
nl
pl
pt-BR
ro
ru
tr
uk
zh-CN
zh-TW
```

> One line = one translation. For some translations we need a custom format for the locale ;)

 :warning: YOU MUST FOLLOW THIS FORMAT when there is a locale.
 To find the format it's easy, look at the URL: https://crowdin.com/project/<prject-name>/pt-BR# -> ok it's pt-BR

You can build this file inside your app via:

```sh
$ proton-i18n crowdin --list --type --limit=95 > po/i18n.txt
``` 

> _list based on the code of the translation and limit progress >= 95 + approved >= 95_
