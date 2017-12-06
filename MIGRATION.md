1. Run transpiler
2. Copy assets, sass, app/templates, i18n to /src-tmp
3. Copy app.html, .htaccess
4. Format and copy translateAttribute to commons
5. Format app.html
6. Format .htaccess
7. Format notification Provider
8. Copy content assets/img/loaders/* to assets/img/
9. Lint
10. Generate a cache file for i18n -> commit it only on release
11. `$ npm i && npm start`


### translateAttribute

```js
// Adapted from https://github.com/rubenv/angular-gettext/blob/master/src/directive.js
function generateDirective(attrName) {

    function normalizeAttributeName(attributeName) {
        // copied from angular.js v1.2.2
        // (c) 2010-2012 Google, Inc. http://angularjs.org
        // License: MIT
        // Copied from http://thetoeb.de/2014/01/14/angular-normalized-attribute-names/
        // Modified to escape hyphens in the regexs

        const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g;
        const MOZ_HACK_REGEXP = /^moz([A-Z])/;

        function camelCase(name) {
            return name.replace(SPECIAL_CHARS_REGEXP, (_, separator, letter, offset) => {
                return offset ? letter.toUpperCase() : letter;
            }).replace(MOZ_HACK_REGEXP, 'Moz$1');
        }

        const PREFIX_REGEXP = /^(x[:\-_]|data[:\-_])/i;

        function directiveNormalize(name) {
            return camelCase(name.replace(PREFIX_REGEXP, ''));
        }
        return directiveNormalize(attributeName);
    }

    function assert(condition, missing, found) {
        if (!condition) {
            throw new Error('You should add a ' + missing + ' attribute whenever you add a ' + found + ' attribute.');
        }
    }

    const normAttrName = normalizeAttributeName(attrName);

    return ['gettextCatalog', '$parse', '$animate', '$compile', function (gettextCatalog, $parse, $animate, $compile) {

        return {
            restrict: 'A',
            terminal: true,
            priority: 1000,
            compile(element, attrs) {
                // Validate attributes
                if (!attrs[normAttrName + 'Translate']) {
                    throw new Error('Missing ' + normAttrName + '-translate attribute!');
                }
                assert(!attrs[normAttrName + 'TranslatePlural'] || attrs[normAttrName + 'TranslateN'], normAttrName + 'translate-n', normAttrName + 'translate-plural');
                assert(!attrs[normAttrName + 'TranslateN'] || attrs[normAttrName + 'TranslatePlural'], normAttrName + 'translate-plural', normAttrName + 'translate-n');

                const msgid = attrs[normAttrName + 'Translate'];
                const translatePlural = attrs[normAttrName + 'TranslatePlural'];
                const translateContext = attrs[normAttrName + 'TranslateContext'];

                return {
                    pre(scope, element, attrs) {
                        const attribute = attrs[normAttrName + 'TranslateN'];
                        const countFn = attribute ? angular.noop : $parse(attribute);
                        let pluralScope = null;

                        function update() {
                            // Fetch correct translated string.
                            let translated;
                            if (translatePlural) {
                                /* eslint no-param-reassign: "off" */
                                scope = pluralScope || (pluralScope = scope.$new());
                                scope.$count = countFn(scope);
                                translated = gettextCatalog.getPlural(scope.$count, msgid, translatePlural, null, translateContext);
                            } else {
                                translated = gettextCatalog.getString(msgid, null, translateContext);
                            }

                            const oldContents = attrs[normAttrName];

                            // Avoid redundant swaps
                            if (translated === oldContents) {
                                return;
                            }

                            // Swap in the translation
                            element[0].setAttribute(attrName, translated);
                        }

                        if (attribute) {
                            scope.$watch(attribute, update);
                        }

                        /**
                         * @ngdoc event
                         * @name translate#gettextLanguageChanged
                         * @eventType listen on scope
                         * @description Listens for language updates and changes translation accordingly
                         */
                        scope.$on('gettextLanguageChanged', update);

                        update();

                        element.removeAttr(attrName + '-translate');

                        $compile(element)(scope);
                    }
                };
            }
        };
    }];
}

export default {
    placeholder: generateDirective('placeholder'),
    title: generateDirective('title'),
    tooltip: generateDirective('pt-tooltip')
};
```

### app.html

```html
<!DOCTYPE html>
<html lang="en" ng-app="proton" class="protonmail">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta http-equiv="x-dns-prefetch-control" content="off">
    <base href="/">
    <title>ProtonMail - Log in</title>
    <meta name="description" content="Log in or create an account.">

    <link rel="apple-touch-icon" sizes="57x57" href="/assets/favicons/apple-touch-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/assets/favicons/apple-touch-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/assets/favicons/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/assets/favicons/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/assets/favicons/apple-touch-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/assets/favicons/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/assets/favicons/apple-touch-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/assets/favicons/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/apple-touch-icon-180x180.png">
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-32x32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-194x194.png" sizes="194x194">
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-96x96.png" sizes="96x96">
    <link rel="icon" type="image/png" href="/assets/favicons/android-chrome-192x192.png" sizes="192x192">
    <link rel="icon" type="image/png" href="/assets/favicons/favicon-16x16.png" sizes="16x16">
    <link rel="manifest" href="/manifest.json">
    <link rel="mask-icon" href="/assets/favicons/safari-pinned-tab.svg" color="#333366">
    <link rel="shortcut icon" href="/assets/favicons/favicon.ico">
    <meta name="apple-mobile-web-app-title" content="ProtonMail">
    <meta name="application-name" content="ProtonMail">
    <meta name="msapplication-TileColor" content="#333366">
    <meta name="msapplication-TileImage" content="/assets/favicons/mstile-144x144.png">
    <meta name="theme-color" content="#333366">
    <meta name="apple-itunes-app" content="app-id=979659905"/>
    <custom-theme ng-if="(isLoggedIn && !isLocked)"></custom-theme>
</head>
<body ng-class="{
    locked: (isLoggedIn && isLocked) || ('login'|isState) || ('login.unlock'|isState) || ('eo.unlock'|isState) || ('eo.message'|isState) || ('reset'|isState) || ('eo.reply'|isState) || ('reset'|isState),
    login:!isLoggedIn,
    unlock:isLocked,
    secure:isSecure,
    light: ('support.reset-password'|isState) || ('signup'|isState) || ('login.setup'|isState) || ('pre-invite'|isState) || ('support.message'|isState),
    scroll: ('signup'|isState) || ('login.setup'|isState) || ('secured.print'|isState)
}" data-detect-time-width data-app-config-body>

<proton-loader></proton-loader>

<div id="pm_slow" class="pm-loader-fullpage" ng-hide="networkActivity.loading() || loggingOut || isSecure">
    <div class="atomLoader">
        <div class="atomLoader-container">
            <div class="atomLoader-item"></div>
            <div class="atomLoader-item2"></div>
            <div class="atomLoader-item3"></div>
            <div class="atomLoader-proton"></div>
        </div>
      <p class="atomLoader-text">Loading ProtonMail</p>
    </div>
</div>
<div id="pm_slow2" style="display:none;">Loading Message...</div>
<div ui-view="main" autoscroll="false" id="body"></div>

<noscript class="pm_noscript">ProtonMail requires Javascript. Enable Javascript and reload this page to continue.</noscript>


<script type="text/javascript">
    if(window.location.href.indexOf("/eo/") > -1) {
        document.getElementById('pm_slow').style.display = 'none';
        document.getElementById('pm_slow2').style.display = 'flex';
    }
    else {
        document.getElementById('pm_slow').style.display = 'flex';
        document.getElementById('pm_slow2').style.display = 'none';
    }

    // required features check
    function is_good_prng_available() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        } else {
            return false;
        }
    }
    if (navigator.cookieEnabled===false) {
        alert('Cookies are required to use ProtonMail. Please enable cookies in your browser.');
        window.location = "https://protonmail.com/compatibility";
    }
    if(typeof Storage === "undefined") {
        alert('sessionStorage is required to use ProtonMail. Please enable sessionStorage in your browser.');
        window.location = "https://protonmail.com/compatibility";
    }
    if (is_good_prng_available()===false) {
        alert('A browser that has a Pseudo Random Number Generator is required to use ProtonMail. Please update your browser.');
        window.location = "https://protonmail.com/compatibility";
    }
</script>
</body>
</html>
```

### .htaccess

```
RewriteEngine On

RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Redirect nothing to app
RewriteRule ^$ /index.html [NC,L]

# Hide .git stuff
RewriteRule ^.*?\.git.* /index.html [NC,L]

RewriteCond %{REQUEST_FILENAME} -s [OR]
RewriteCond %{REQUEST_FILENAME} -l [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^.*$ - [NC,L]

RewriteRule ^(.*) /index.html [NC,L]

# Error pages
ErrorDocument 403   /assets/errors/403.html

<Files index.html>
    FileETag None
    Header unset ETag
    Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
</Files>
```

### Notification Provider

```js
/* @ngInject */
function notification() {

        const CONFIG = {
            classNames: {
                error: 'notification-danger',
                success: 'notification-success',
                info: 'notification-info'
            }
        };


        this.typeClasses = (config = {}) => _.extend(CONFIG.classNames, config);
        this.duration = (value = 6000) => (CONFIG.duration = value);
        this.template = (value = '') => (CONFIG.template = value);

        /* @ngInject */
        this.$get = ['notify', (notify) => {

            const action = (type) => (input, options = {}) => {

                const message = (input instanceof Error) ? input.message : input;
                options.classes = `${options.classes || ''} ${CONFIG.classNames[type]}`.trim();
                (type === 'error') && (options.duration = 10000);

                notify(_.extend({ message }, options));
            };

            const config = {
                position: 'center',
                maximumOpen: 5,
                duration: 6000
            };

            CONFIG.template && (config.templateUrl = CONFIG.template);

            notify.config(config);

            return {
                success: action('success'),
                error: action('error'),
                info: action('info')
            };
        }];
}
export default notification;
```

### Font Awesome

File `_icons.scss`

```
@import "../../node_modules/components-font-awesome/css/font-awesome.css";
```
