angular.module('proton.squire')
    .factory('squireDropdown', ($rootScope, squireEditor, onCurrentMessage) => {

        const MAIN_CACHE = {};
        const CLASSNAME = {
            IS_OPEN: 'squireDropdown-is-open',
            LABEL: 'squireDropdown-item-label',
            DROPDOWN_ELEMENT: 'squireToolbar-select-item'
        };

        /**
         * Create dropdown helper for Squire
         * @param  {String} ID MessageID
         * @return {Object}
         */
        return (message) => {

            const ID = message.ID;
            !MAIN_CACHE[ID] && (MAIN_CACHE[ID] = { MAP: {} });
            const CACHE = MAIN_CACHE[ID];

            const attach = (key, value) => (CACHE.MAP[key] = value);

            /**
             * Update the select label and attribute and format the label
             * @param  {String} options.action   Type of squireAction
             * @param  {Object} options.argument SquireAction object
             * @return {void}
             */
            const update = ({ action, argument }) => {


                if (!CACHE.MAP[action]) {
                    return;
                }

                const { attribute, filter = _.identity } = CACHE.MAP[action];
                if (!CACHE.MAP[action].labelNode) {
                    CACHE.MAP[action].labelNode = CACHE.MAP[action].node.querySelector(`.${CLASSNAME.LABEL}`);
                }

                if (attribute) {
                    CACHE.MAP[action].node.setAttribute(attribute, argument.value);
                }

                CACHE.MAP[action].labelNode.textContent = filter(argument.label);
            };

            /**
             * Create a dropdown
             * @param  {Node} node   Main select element
             * @param  {String} action SquireAction
             * @return {Object}
             */
            const create = (node, action) => {

                const unsubscribeList = [];

                const scrollToOption = (value) => {
                    if (!value || squireEditor.getType({ ID }) !== 'message') {
                        return;
                    }
                    const item = node.querySelector(`[data-value^="${value}"]`);
                    item && item.scrollIntoView();
                };

                const unsubscribe = () => {
                    unsubscribeList.forEach((cb) => cb());
                    unsubscribeList.length = 0;
                };

                const subscribeHandlers = () => {
                    // click events on squire don't trigger document.click because of the iframe.
                    unsubscribeList.push(onCurrentMessage('composer.update', { message }, (type) => {
                        if (type === 'editor.focus') {
                            node.classList.remove(CLASSNAME.IS_OPEN);
                            unsubscribe();
                        }
                    }));

                    const closeDropdown = ({ target }) => {
                        if (!node.contains(target) || target.classList.contains(CLASSNAME.DROPDOWN_ELEMENT)) {
                            node.classList.remove(CLASSNAME.IS_OPEN);
                            unsubscribe();
                        }
                    };

                    document.addEventListener('click', closeDropdown);
                    unsubscribeList.push(() => document.removeEventListener('click', closeDropdown));
                };

                const toggle = (onOpen = _.noop) => {
                    node.classList.toggle(CLASSNAME.IS_OPEN);
                    if (node.classList.contains(CLASSNAME.IS_OPEN)) {
                        subscribeHandlers();
                        scrollToOption(onOpen(node));
                        return;
                    }
                    unsubscribe();
                };

                const refresh = (label, value) => update({ action, argument: { label, value } });

                return { toggle, refresh, unsubscribe };
            };

            const matchSelection = () => {
                Object.keys(MAIN_CACHE[ID].MAP).forEach((action) => {
                    $rootScope.$emit('squire.editor', {
                        type: 'squire.native.refresh',
                        data: { action, message }
                    });
                });
            };

            const closeAll = () => {
                Object.keys(MAIN_CACHE[ID].MAP).forEach((action) => {
                    MAIN_CACHE[ID].MAP[action].node.classList.remove(CLASSNAME.IS_OPEN);
                });
            };

            const clear = () => delete MAIN_CACHE[ID];

            return { create, attach, update, clear, matchSelection, closeAll };
        };
    });
