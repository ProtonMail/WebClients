import _ from 'lodash';
import { isIE11, getBrowser, getDevice, getOS } from '../../../helpers/browser';
import { formatLocale } from '../../../helpers/momentHelper';

const BASE_TIMEOUT = 15; // in seconds

export const getRelativeApiHostname = (hostname) => {
    const idx = hostname.indexOf('.');
    const first = hostname.substr(0, idx);
    const second = hostname.substr(idx + 1);
    return `${first}-api.${second}`;
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

    const getChallengeIframeURL = (mode, retry = 0) => {
        const id = mode === 'top' ? 0 : 1;
        return [
            `${ORIGIN.iframeUrl}challenge/html`,
            `?Type=${id}`,
            `&name=${mode}`,
            isIE11() ? '&IE11=1' : '',
            retry > 0 ? `&retry=${retry}` : ''
        ]
            .filter(Boolean)
            .join('');
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
        el.src = `${getChallengeIframeURL(name)}`;
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
            const steps = [];

            const addStep = (text, extra, type = 'step') => {
                steps.push({ text: `${new Date().toISOString()} ${text}`, extra, type });
            };

            const addError = (text, extra) => {
                addStep(text, extra, 'error');
            };

            const handleLoadError = () => {
                el[0].classList.add('signupIframe-loaded');
                el[0].classList.add('signupIframe-error');
            };

            const log = async (fatal = false) => {
                if (!steps.some((x) => x.type === 'error')) {
                    return;
                }
                const extra = {
                    steps,
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
                    iframe.src = getChallengeIframeURL(name, attempts);
                    return;
                }

                addError(`${name} ${iframe.src} gave up`);
                handleLoadError();
                log(true);
            };

            // Wait x seconds to check if the iframe is properly loaded
            timeoutID = setTimeout(() => {
                addError(`${name} ${iframe.src} timed out after ${BASE_TIMEOUT}s`);
                handleRetry();
            }, BASE_TIMEOUT * 1000);

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

            wizard.onLoad(name, () => {
                addStep('iframe onload');

                iframe.contentWindow.postMessage(
                    {
                        type: 'init.challenge',
                        data: {
                            name,
                            config: getConfig(name, scope.account || scope.model)
                        }
                    },
                    ORIGIN.iframe
                );
            });

            wizard.onDone(name, () => {
                clearTimeout(timeoutID);
                loaded = true;
                el[0].classList.add('signupIframe-loaded');
                addStep('iframe loaded');
                log();
            });

            const cb = (e) => {
                addStep('data', e.data, 'message');
            };

            window.addEventListener('message', cb, false);

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
                helpButton.removeEventListener('click', onClick);
                window.removeEventListener('message', cb, false);
            });
        }
    };
}

export default signupIframe;
