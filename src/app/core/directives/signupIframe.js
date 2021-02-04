import _ from 'lodash';
import CONFIG from '../../config';
import { uniqID } from '../../../helpers/string';
import { isIE11, isEdge, getBrowser, getDevice, getOS } from '../../../helpers/browser';
import { formatLocale } from '../../../helpers/momentHelper';

const BASE_TIMEOUT = 15; // in seconds

const get = (url) => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('GET', url);

        req.timeout = 15000;

        const getErrorInfo = (e) => {
            return {
                status: req.status,
                statusText: req.statusText,
                readyState: req.readyState,
                loaded: e.loaded,
                type: e.type
            };
        };

        req.onload = (e) => {
            if (req.status === 200) {
                resolve(req.response);
                return;
            }

            const error = Error(req.statusText);
            error.info = getErrorInfo(e);
            reject(error);
        };

        req.ontimeout = (e) => {
            const error = Error('Request timed out');
            error.info = getErrorInfo(e);
            reject(error);
        };

        req.onabort = (e) => {
            const error = Error('Request aborted');
            error.info = getErrorInfo(e);
            reject(error);
        };

        req.onerror = (e) => {
            const error = Error('Network error');
            error.info = getErrorInfo(e);
            reject(error);
        };

        req.send();
    });
};

/* @ngInject */
function signupIframe(dispatchers, iframeVerifWizard, pmDomainModel, User, gettextCatalog, $injector) {
    const getDomains = () => {
        return pmDomainModel.get().map((value, i) => ({
            selected: i === 0,
            value
        }));
    };

    const ORIGIN = iframeVerifWizard.getOrigin();
    const IFRAME = `${ORIGIN.iframe}/abuse.iframe.html`;

    const getConfig = (name, { username = '' } = {}) => {
        const I18N = {
            PLACEHOLDER_USERNAME: gettextCatalog.getString('Choose username', null, 'Placeholder'),
            LABEL_DOMAIN: gettextCatalog.getString('Select a domain', null, 'Title'),
            LABEL_RECOVERY: gettextCatalog.getString('Add a recovery email', null, 'Title'),
            PLACEHOLDER_RECOVERY: gettextCatalog.getString('Recovery email', null, 'Placeholder'),
            AGREE_TXT: gettextCatalog.getString('By clicking Create Account, you agree to abide by', null, 'Info'),
            AGREE_LINK: gettextCatalog.getString("ProtonMail's Terms and Conditions", null, 'Title'),
            AGREE_ALREADY: gettextCatalog.getString('Already have an account?', null, 'Action'),
            BUTTON: gettextCatalog.getString('Create Account', null, 'Action'),
            ERRORS: {
                USERNAME: {
                    REQUIRED: gettextCatalog.getString('Username required', null, 'Error'),
                    MAXLENGTH: gettextCatalog.getString(
                        'maximum length for a username is {{maxlength}} characters',
                        { maxlength: 40 },
                        'Error'
                    ),
                    PATTERN: gettextCatalog.getString(
                        'It must contain only letters/digits or - and start with a letter/digit',
                        null,
                        'Error'
                    ),
                    TOO_MUCH: gettextCatalog.getString(
                        'You are doing this too much, please try again later',
                        null,
                        'Error'
                    ),
                    OFFLINE: gettextCatalog.getString('No Internet connection found.', null, 'Error'),
                    REQUEST: gettextCatalog.getString('The request failed', null, 'Error')
                },
                EMAIL: {
                    PATTERN: gettextCatalog.getString('Invalid email', null, 'Error')
                }
            },
            USERNAME: {
                AVAILABLE: gettextCatalog.getString('Username available', null, 'Info'),
                CHECKING: gettextCatalog.getString('Checking username', null, 'Info')
            }
        };

        const config = {
            top: [
                {
                    component: 'username',
                    label: I18N.PLACEHOLDER_USERNAME,
                    placeholder: I18N.PLACEHOLDER_USERNAME,
                    maxlength: 40,
                    minlength: 1,
                    required: true,
                    name: 'username',
                    value: username,
                    domains: {
                        component: 'domains',
                        label: I18N.LABEL_DOMAIN,
                        name: 'domain',
                        options: getDomains()
                    },
                    errors: I18N.ERRORS.USERNAME,
                    messages: {
                        username: I18N.USERNAME
                    }
                }
            ],
            bottom: [
                {
                    component: 'email',
                    label: I18N.LABEL_RECOVERY,
                    placeholder: I18N.PLACEHOLDER_RECOVERY,
                    type: 'email',
                    name: 'notificationEmail',
                    errors: I18N.ERRORS.EMAIL
                },
                {
                    component: 'signupSubmit',
                    baseUrl: window.location.origin,
                    messages: {
                        agreeLabel: I18N.AGREE_TXT,
                        agreeLink: I18N.AGREE_LINK,
                        alreadyUser: I18N.AGREE_ALREADY
                    },
                    button: {
                        label: I18N.BUTTON
                    }
                }
            ]
        };

        return {
            name,
            targetOrigin: ORIGIN.app,
            config: config[name]
        };
    };

    const getChallenge = (mode) => {
        const id = mode === 'top' ? 0 : 1;

        // If you want to run the local version
        // if (CONFIG.debug) {
        //     return ['vendors~challenge.js', 'challenge.js?id=$id&token=pR0t0n_secretkey'].map((key, i) => {
        //         const file = key.replace('$id', i);
        //         return `http://localhost:3333/dist/${file}`;
        //     });
        // }
        //

        const { apiUrl } = CONFIG;
        const url = apiUrl.startsWith('/') ? `${window.location.origin}${apiUrl}` : apiUrl;
        return [`${url}/challenge/js?Type=${id}`];
    };

    /**
     * We create the list of script we want inside the iframe,
     * we create a unique token for main.js as if we use only main.js,
     * iframes won't work anymore. It's a weird edge case when you
     * load content from the same domain :/ Cache ?
     * @param  {String} name Type of iframe
     * @return {Object}  { scripts: <Array>, styles: <Array> }
     */
    const createIframeAssets = (name) => {
        const token = uniqID();
        const challenge = getChallenge(name);
        const origin = window.location.origin;

        // Compatibility bundle for IE
        const appFile = !isIE11() && !isEdge() ? 'main' : 'main.ie11';
        const scripts = [`${origin}/form/${appFile}.js?test=${token}`, ...challenge];
        const styles = [`${origin}/form/main.css?test=${token}`];

        return {
            scripts,
            styles
        };
    };

    /**
     * Create the iframe template:
     *     - We must use the queryParm so the formGenerator have a scope
     *     - We need the data attribute for UI changes ask by the formGenerator
     * @param {String} name
     * @return {String}
     */
    const createIframe = (name) => {
        const el = document.createElement('iframe');
        el.title = 'Registration form';
        el.scrolling = 'no';
        el.className = name;
        el.dataset.name = name;
        el.sandbox = 'allow-scripts allow-same-origin allow-popups allow-top-navigation';
        el.src = `${IFRAME}?name=${name}`;
        return el;
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/core/signupIframe.tpl.html'),
        link(scope, el, { mode }) {
            const { dispatcher } = dispatchers(['bugReport']);
            const wizard = iframeVerifWizard('signupUserForm');
            let loaded = false;
            let attempts = 0;

            const name = mode || 'top';
            const iframe = createIframe(name);
            let timeoutID;
            let assets;
            const errors = [];
            const steps = [];

            const addError = (text, extra) => {
                errors.push({ text: `${new Date().toISOString()} ${text}`, extra });
            };

            const addStep = (text, extra) => {
                steps.push({ text: `${new Date().toISOString()} ${text}`, extra });
            };

            const handleLoadError = () => {
                el[0].classList.add('signupIframe-loaded');
                el[0].classList.add('signupIframe-error');
            };

            const getAssetsURLs = () => {
                if (!assets) {
                    return [iframe.src];
                }
                return [iframe.src, ...assets.scripts, ...assets.styles];
            };

            const getRequestInfo = async () => {
                if (window.location.origin !== 'https://mail.protonmail.com') {
                    return {
                        attempts
                    };
                }

                const result = await Promise.all(
                    getAssetsURLs().map(async (asset) => {
                        return get(asset)
                            .then(() => [asset, 'ok'])
                            .catch((e) => [asset, { message: e.message, info: e.info }]);
                    })
                );

                return {
                    result,
                    attempts
                };
            };

            const log = async (fatal = false) => {
                if (!errors.length) {
                    return;
                }
                const info = await getRequestInfo();
                const extra = {
                    info,
                    steps,
                    errors,
                    browser: getBrowser(),
                    device: getDevice(),
                    os: getOS(),
                    locale: formatLocale(),
                    time: new Date().toString()
                };
                const message = fatal ? 'Failed to load signupiframe fatally' : 'Failed to load signupiframe partially';
                $injector.get('bugReportApi').message(message, { extra });
            };

            const handleRetry = () => {
                if (loaded) {
                    return;
                }
                addStep(`retry ${attempts}`);
                if (++attempts <= 2) {
                    clearTimeout(timeoutID);
                    const jitter = _.random(0, 5);
                    timeoutID = setTimeout(() => {
                        handleRetry();
                    }, (BASE_TIMEOUT + attempts * 10 - jitter) * 1000);
                    iframe.src = `${IFRAME}?name=${name}&retry=${attempts}`;
                    return;
                }

                handleLoadError();
                log(true);
            };

            // Wait x seconds to check if the iframe is properly loaded
            timeoutID = setTimeout(() => {
                addError(`${name} ${iframe.src} timed out after ${BASE_TIMEOUT}s`);
                handleRetry();
            }, BASE_TIMEOUT * 1000);

            /**
             * Fire in the hole, iframe is loaded, give it the form config.
             */
            const onLoad = () => {
                if (!iframe.contentWindow) {
                    clearTimeout(timeoutID);
                    handleRetry();
                    addError('Missing contentWindow');
                    return;
                }

                addStep('iframe onload');
                assets = createIframeAssets(name);

                clearTimeout(timeoutID);
                timeoutID = setTimeout(() => {
                    addError(`${name} ${iframe.src} no response after ${BASE_TIMEOUT}s`);
                    handleRetry();
                }, BASE_TIMEOUT * 1000);

                iframe.contentWindow.postMessage(
                    {
                        type: 'init.iframe',
                        data: {
                            name,
                            ...assets,
                            config: getConfig(name, scope.account || scope.model)
                        }
                    },
                    ORIGIN.iframe
                );
            };

            // Register hook onMessage from the iframe for this namespace.
            wizard.register(mode, iframe, ({ data: dataEvent }) => {
                const { form, fingerprint } = dataEvent.data;
                const user = {
                    ...form.inputs,
                    ...form.selects
                };
                return { fingerprint, user };
            });

            let retryID;

            wizard.onError((info) => {
                addError('onerror', info);
            });

            wizard.onLoad(name, (isError, { name, file } = {}) => {
                clearTimeout(timeoutID);
                if (isError) {
                    addError(`${name} file onerror for ${file}`);
                    // Since this is more or less instant, delay it slightly
                    retryID = setTimeout(() => {
                        handleRetry();
                        retryID = undefined;
                    }, (2 + _.random(0, 5)) * 1000);
                    return;
                }
                if (retryID) {
                    return;
                }
                loaded = true;
                el[0].classList.add('signupIframe-loaded');
                addStep('iframe loaded');
                log();
            });

            iframe.addEventListener('load', onLoad, true);
            el[0].querySelector('.signupIframe-iframe').appendChild(iframe);
            addStep('added iframe');

            const helpButton = el[0].querySelector('[data-action="help"]');
            const onClick = () => {
                dispatcher.bugReport('new');
            };
            helpButton.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                clearTimeout(timeoutID);
                clearTimeout(retryID);
                iframe.removeEventListener('load', onLoad, true);
                helpButton.removeEventListener('click', onClick);
            });
        }
    };
}

export default signupIframe;
