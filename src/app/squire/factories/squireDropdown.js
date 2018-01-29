import _ from 'lodash';

/* @ngInject */
function squireDropdown($rootScope, squireEditor, editorModel, onCurrentMessage) {
    const MAIN_CACHE = {};
    const CLASSNAME = {
        IS_OPEN: 'squireDropdown-is-open',
        LABEL: 'squireDropdown-item-label',
        DROPDOWN_ELEMENT: 'squireToolbar-select-item'
    };
    const KEY_ARROW_INPUT = [38, 39, 40, 37, 33, 34, 36, 35]; // URDL FastUP FastDown

    /**
     * Create dropdown helper for Squire
     * @param  {Object} Message
     * @return {Object}
     */
    return (message) => {
        const ID = message.ID;
        !MAIN_CACHE[ID] && (MAIN_CACHE[ID] = { MAP: {} });

        const CACHE = MAIN_CACHE[ID];

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
        const create = (node, action, config) => {
            const unsubscribeList = [];
            CACHE.MAP[action] = _.extend({}, config, { node });

            // Refresh dropdown label
            const refresh = (label, value) => update({ action, argument: { label, value } });

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

            const close = () => {
                node.classList.remove(CLASSNAME.IS_OPEN);
            };

            /**
             * Detect when we need to close the dropdown
             *     - Close on another dropdwon
             *     - Close on click inside the editor
             * @return {Function} Unsubscribe
             */
            const subscribeHandlers = () => {
                const { editor } = editorModel.find(message);
                editor.addEventListener('click', close);

                // Close the dropdown when an action has been inserted, or another dropdown is opened.
                const onEditor = onCurrentMessage('squire.editor', { message }, (type, data) => {
                    if (type === 'squire.native.action' || type === 'squireActions' || (type === 'squireDropdown' && data.action !== action)) {
                        close();
                    }
                });

                // Close the dropdown when clicking anywhere outside.
                const closeDropdown = ({ target }) => {
                    if (!node.contains(target) || target.classList.contains(CLASSNAME.DROPDOWN_ELEMENT)) {
                        close();
                    }
                };

                document.body.addEventListener('mousedown', closeDropdown);

                return () => {
                    document.body.removeEventListener('mousedown', closeDropdown);
                    editor.removeEventListener('click', close);
                    onEditor();
                };
            };

            /**
             * When we toogle the dropdown, we need to scroll to the selected option
             * and do something
             * @param  {Function} onOpen return a value/undefined
             * @return {void}
             */
            const toggle = (onOpen = _.noop) => {
                node.classList.toggle(CLASSNAME.IS_OPEN);
                if (node.classList.contains(CLASSNAME.IS_OPEN)) {
                    $rootScope.$emit('squire.editor', {
                        type: 'squireDropdown',
                        data: {
                            action,
                            message,
                            type: 'is.open'
                        }
                    });

                    scrollToOption(onOpen(node));
                }
            };

            /**
             * Parse the current content of the message when we click on a line
             * or we type. The goal is to find the font, color, size etc. And refresh
             * the toolbar
             * @return {Function} Unsubscribe
             */
            const editorEvents = () => {
                const { editor } = editorModel.find(message);
                const fn = () => _.noop;
                const { parseContent = fn } = CACHE.MAP[action];
                const parser = parseContent(refresh);

                const onKeyup = (e) => {
                    KEY_ARROW_INPUT.includes(e.keyCode) && parser();
                };

                editor.addEventListener('click', parser);
                editor.addEventListener('keyup', onKeyup);

                // Refresh dropdwon when we select the current option
                const onEditor = onCurrentMessage('squire.editor', { message }, (type, data) => {
                    data.action === action && config.parseContent && config.parseContent(refresh);
                });

                return () => {
                    editor.removeEventListener('click', parser);
                    editor.removeEventListener('keyup', onKeyup);
                    onEditor();
                };
            };

            unsubscribeList.push(subscribeHandlers());
            unsubscribeList.push(editorEvents());

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

        /**
         * Close all dropdown which is not the current one if we provide one
         * @param  {String} filter dropdwon name
         */
        const closeAll = (filter) => {
            Object.keys(MAIN_CACHE[ID].MAP).forEach((action) => {
                if (filter !== action) {
                    MAIN_CACHE[ID].MAP[action].node.classList.remove(CLASSNAME.IS_OPEN);
                }
            });
        };

        const clear = () => delete MAIN_CACHE[ID];

        return { create, update, clear, matchSelection, closeAll };
    };
}

export default squireDropdown;
