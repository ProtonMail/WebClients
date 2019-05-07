import CONFIG from '../../config';
import { IFRAME_SECURE_ORIGIN, CANCEL_REQUEST } from '../../constants';
import { uniqID } from '../../../helpers/string';

/* @ngInject */
function iframeVerifWizard(dispatchers, User, $q) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['signup']);

    const ORIGIN = getOrigin();

    function getOrigin() {
        return {
            app: window.location.origin,
            iframe: CONFIG.securedIframe || IFRAME_SECURE_ORIGIN
        };
    }

    /**
     * Create a scope by namespace, where we store a list of hooks to apply
     * on the onMessage event trigger by iframes using the same namespace.
     * @param  {String}   id Namespace
     * @return {Object}      {register<Function>, listen<Function>}
     */
    function main(id) {
        /*
            USing a ref is very important as we can use the same namespace with
            diff components. We register 1 or more hooks to apply for 1 namesapce.
         */
        if (!CACHE[id]) {
            CACHE[id] = {
                callbacks: [],
                onLoad: {}
            };
            // CLEAR ON DESTROY
        }
        // Store a local ref
        const callbacks = CACHE[id].callbacks;

        // Aggregator cache
        const LOCAL_CACHE = {
            i: 0,
            data: { user: {}, data: {} }
        };

        /**
         * Apply an action to a specific iframe only
         * @param  {Array} list  List of iframes
         * @param  {String} name Name of the iframe we update
         * @return {Function}    (<Function(iframe)>):void
         */
        const applyToIframe = (list, name) => (cb) => {
            list.forEach(({ iframe }) => {
                const isIframe = iframe.getAttribute('data-name') === name;
                isIframe && cb(iframe);
            });
        };

        /**
         * Update iframes when they contact us for UI modifications
         * @param  {Array} list          List of ifrmae
         * @param  {String} options.type Type of event
         * @param  {Object} options.data
         * @return {void}
         */
        const updateIframes = (list, { type, data = {} } = {}) => {
            const action = applyToIframe(list, data.name);

            if (type === 'usernameInput.info') {
                action((iframe) => {
                    iframe.setAttribute('data-is-loading', data.isLoading);
                    iframe.setAttribute('data-has-error', data.isError);
                    iframe.setAttribute('data-has-suggestions', !!data.suggestions.length);
                    iframe.setAttribute('data-is-available', data.isAvailable);
                });
            }

            if (type === 'emailInput.info') {
                action((iframe) => {
                    iframe.setAttribute('data-has-error', data.isError);
                });
            }
        };

        /**
         * Send data to the iframe
         * @param  {Object} data        Data to send
         * @param  {String} modeFilter  Filter which modal gets the data, undefined to target them all
         * @return {Function}           ({ iframe: <Node>, mode: <String> })
         */
        const postMessage = (data, modeFilter) => ({ iframe, mode }) => {
            if ((modeFilter && modeFilter === mode) || !modeFilter) {
                iframe.contentWindow.postMessage(
                    {
                        ...data,
                        targetOrigin: ORIGIN.app
                    },
                    ORIGIN.iframe
                );
            }
        };

        /**
         * Ask to all iframes if they can give us their values
         * @param  {Array} list     List of iframes
         * @param  {Boolean} fallback false if the Challenge API is down, coming from the secure iframe abuse
         * @return {void}
         */
        function askIframeToSubmit(list, fallback = LOCAL_CACHE.fallback) {
            // Send this message to all iframes to trigger crunch data
            list.forEach(
                postMessage({
                    type: 'submit.broadcast',
                    fallback // Challenge API is down
                })
            );
        }

        /**
         * Factory listener callback takes a list of hooks to apply
         * @param  {Array}  list List of hooks to apply
         * @return {Function}      Callback event listener
         */
        const onMessage = (list = []) => (e) => {
            const isSameOrigin = e.origin === ORIGIN.iframe;
            if (!isSameOrigin) {
                return;
            }

            if (e.data.type === 'child.message.data') {
                const { id } = e.data.data;
                const customIDDev = uniqID();

                // During dev id === {{id}}
                const key = id === '{{id}}' ? customIDDev : id;

                const data = list.reduce((acc, { cb }) => {
                    const { fingerprint, user } = cb(e);
                    acc.user = { ...acc.user, ...user };
                    acc.data[key] = fingerprint;
                    return acc;
                }, LOCAL_CACHE.data);

                // Index to be able to know when it is the last event emitted
                LOCAL_CACHE.i++;

                // Latest -> dispatch action to the app with data
                if (LOCAL_CACHE.i === list.length) {
                    dispatcher.signup('iframe.message', data);

                    // On fait le ménache
                    LOCAL_CACHE.i = 0;
                    LOCAL_CACHE.data = { user: {}, data: {} };
                }
            }

            updateIframes(list, e.data);

            // Iframe loaded the micro app
            if (e.data.type === 'app.loaded') {
                const action = CACHE[id].onLoad[e.data.data.name];
                action && action();
            }

            // Iframe failed to load the micro app
            if (e.data.type === 'app.loaded.error') {
                const { name, file } = e.data.data || {};
                const action = CACHE[id].onLoad[name];
                action && action(true, { name, file });
            }

            if (['usernameInput.info', 'emailInput.info'].includes(e.data.type)) {
                LOCAL_CACHE.fallback = e.data.data.fallback;
                if (e.data.data.isEnter && !e.data.data.isError) {
                    askIframeToSubmit(list, e.data.data.fallback);
                }
            }

            if (e.data.type === 'submit.init') {
                askIframeToSubmit(list, e.data.data.fallback);
            }

            if (e.data.type === 'usernameInput.request') {
                checkUsername(list, e.data.data || {});
            }
        };

        const CACHE_REQUEST = {};
        async function checkUsername(list, { name, queryParam: params }) {
            if (CACHE_REQUEST.deferred) {
                CACHE_REQUEST.deferred.resolve(CANCEL_REQUEST);
                CACHE_REQUEST.deferred = undefined;
            }

            CACHE_REQUEST.request = params.Name;
            CACHE_REQUEST.deferred = $q.defer();

            User.available({ params, noNotify: true, timeout: CACHE_REQUEST.deferred.promise })
                .then(({ data }) => ({ data, success: true }))
                .catch((e) => {
                    const { data = {}, xhrStatus } = e;

                    // Cancel request -> if latest one was not done after second event (new value)
                    if (xhrStatus === 'abort') {
                        return;
                    }
                    return { data, success: false };
                })
                .then((data) => {
                    CACHE_REQUEST.deferred = undefined;

                    // There is already another query pending --- do nothing to keep the loader active
                    if (CACHE_REQUEST.request !== params.Name) {
                        return;
                    }

                    // Send this message to all iframes to trigger crunch data
                    data &&
                        list.forEach(
                            postMessage(
                                {
                                    type: 'usernameInput.query',
                                    data,
                                    value: params.Name
                                },
                                name
                            )
                        );
                });
        }

        /**
         * Create a listener for a namespace
         * @return {Function} Unsubscribe
         */
        const listen = () => {
            // Use the ref as we can mutate the number of hooks to apply
            const cb = onMessage(CACHE[id].callbacks);
            window.addEventListener('message', cb, false);

            return () => {
                window.removeEventListener('message', cb, false);
                delete CACHE[id];
            };
        };

        /**
         * Register a hook to apply onMessage
         * @param  {String}   mode   Type of iframe
         * @param  {Node}   iframe
         * @param  {Function} cb     Hook to Apply, MUST RETURN A DATA { user, data }
         * @return {void}
         */
        const register = (mode, iframe, cb) => {
            // Prevent duplicates if Angular does some shit
            if (!callbacks.some((item) => item.mode === mode)) {
                callbacks.push({ mode, iframe, cb });
            }
        };

        const onLoad = (mode, cb) => {
            CACHE[id].onLoad[mode] = cb;
        };

        const triggerSubmit = () => askIframeToSubmit(CACHE[id].callbacks);

        return { register, listen, onLoad, triggerSubmit };
    }

    main.getOrigin = getOrigin;

    return main;
}
export default iframeVerifWizard;
