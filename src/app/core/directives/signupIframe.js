import _ from 'lodash';
import CONFIG from '../../config';
import { uniqID } from '../../../helpers/string';
import { isIE11, isEdge } from '../../../helpers/browser';

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
    const createIframe = (name) =>
        `<iframe
            title="Registration form"
            scrolling="no"
            class="${name}"
            data-name="${name}"
            sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation"
            src="${IFRAME}?name=${name}"></iframe>`;

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/core/signupIframe.tpl.html'),
        link(scope, el, { mode }) {
            const { dispatcher } = dispatchers(['signup']);
            const wizard = iframeVerifWizard('signupUserForm');
            let loaded = false;
            let attempts = 0;

            const name = mode || 'top';
            el[0].querySelector('.signupIframe-iframe').innerHTML = createIframe(name);
            const iframe = el[0].querySelector('iframe');
            let timeoutID;

            const handleLoadError = () => {
                el[0].classList.add('signupIframe-loaded');
                el[0].classList.add('signupIframe-error');
            };

            const checkIframeLoaded = () => {
                if (loaded) {
                    return;
                }

                const timeoutError = new Error(
                    `[signupIframe] ${name} -Cannot load  ${iframe.src} attempt ${attempts}`
                );

                if (++attempts <= 2) {
                    timeoutID = setTimeout(checkIframeLoaded, (10 + attempts * 5 - _.random(0, 5)) * 1000);
                    iframe.src = `${IFRAME}?name=${name}&retry=${attempts}`;

                    $injector.get('bugReportApi').crash(timeoutError);
                    return;
                }

                handleLoadError();
                $injector.get('bugReportApi').crash(timeoutError);
            };

            // Wait 10 seconds to check if the iframe is properly loaded
            timeoutID = setTimeout(checkIframeLoaded, 10 * 1000);

            /**
             * Fire in the hole, iframe is loaded, give it the form config.
             */
            const onLoad = () => {
                dispatcher.signup('iframe.loaded');
                iframe.contentWindow.postMessage(
                    {
                        type: 'init.iframe',
                        data: {
                            name,
                            ...createIframeAssets(name),
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

            wizard.onLoad(name, (isError, { name, file } = {}) => {
                loaded = !isError;

                el[0].classList.add('signupIframe-loaded');

                // Throw error to track it
                if (isError) {
                    handleLoadError();
                    const error = new Error(`[signupIframe] ${name} -Cannot load  ${file}`);
                    $injector.get('bugReportApi').crash(error);
                    throw error;
                }
            });

            iframe.addEventListener('load', onLoad);
            iframe.contentWindow.addEventListener('message', console.log);

            scope.$on('$destroy', () => {
                clearTimeout(timeoutID);
                iframe.removeEventListener('load', onLoad);
            });
        }
    };
}

export default signupIframe;
