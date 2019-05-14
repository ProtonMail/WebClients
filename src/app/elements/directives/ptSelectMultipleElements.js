import _ from 'lodash';

/* @ngInject */
function ptSelectMultipleElements(AppModel, dispatchers) {
    const CACHE = {};
    const countChecked = (list, key) => _.filter(list, { [key]: true }).length;

    /**
     * Select many conversations and update the scope
     * @param  {$scope} scope
     * @return {function}       (previous, from, to)
     */
    function selectListItems(scope, { list, item, selected }) {
        /**
         * Update the scope with selected conversations
         * @param  {Object} previous Previous conversation selected
         * @param  {Number} from     Index conversation
         * @param  {Number} to       Index conversation
         * @return {void}
         */
        return (previous, from, to) => {
            for (let index = from; index < to; index++) {
                scope[list][index][selected] = previous[item][selected];
            }

            AppModel.set('numberElementChecked', countChecked(scope[list], selected));
        };
    }

    const getConfigKeys = (mode) => {
        const keys = {
            elements: {
                list: 'conversations',
                item: 'conversation',
                selected: 'Selected'
            },
            contact: {
                list: 'contacts',
                item: 'contact',
                selected: 'selected'
            }
        };
        return keys[mode];
    };

    return {
        link(scope, el, { ptSelectMultipleElements }) {
            let previous = null;
            const listMode = ptSelectMultipleElements || 'elements';
            const { on, unsubscribe } = dispatchers();
            const configKeys = getConfigKeys(listMode);

            const itemsToSelect = selectListItems(scope, configKeys);

            // cache the previous selected items
            on('dnd', (e, { type, data }) => {
                if (type === 'hook.dragstart') {
                    CACHE.number = data.before.number;
                    CACHE.ids = data.before.ids;

                    AppModel.set('numberElementChecked', 1);
                    _.each(scope[configKeys.list], (item) => {
                        item[configKeys.selected] = false;
                    });
                }
            });

            function onClick({ target, shiftKey }) {
                const index = +target.getAttribute('data-index');

                if (target.nodeName !== 'INPUT' || !/ptSelectConversation/.test(target.className)) {
                    return;
                }

                const isChecked = target.checked;

                scope.$applyAsync(() => {
                    const { list, item, selected } = configKeys;

                    scope[list][index][selected] = isChecked;
                    AppModel.set('numberElementChecked', countChecked(scope[list]));

                    if (shiftKey && previous) {
                        const from = Math.min(index, previous.index);
                        const to = Math.max(index, previous.index);
                        itemsToSelect(previous, from, to);

                        // Unselect the latest click if we unselect a list of checkbox
                        target.checked = previous[item][selected];
                    }

                    AppModel.set('showWelcome', false);

                    previous = {
                        index,
                        [item]: scope[list][index]
                    };
                });
            }

            const onDragEnd = () => {
                _rAF(() => {
                    scope.$applyAsync(() => {
                        const { list, selected } = configKeys;

                        _.each(scope[list], (item) => {
                            if (CACHE.ids) {
                                item[selected] = CACHE.ids.includes(item.ID);
                            }
                            // Auto check drag item, we uncheck it at the end
                            if (AppModel.get('numberElementChecked') === 1 && !CACHE.number) {
                                item[selected] = false;
                            }
                        });

                        AppModel.set('numberElementChecked', CACHE.number || countChecked(scope[list], selected));
                        delete CACHE.number;
                        delete CACHE.ids;
                    });
                });
            };

            el.on('click', onClick);
            document.addEventListener('dragend', onDragEnd);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                document.removeEventListener('dragend', onDragEnd);
                unsubscribe();
                delete CACHE.number;
                delete CACHE.ids;
            });
        }
    };
}
export default ptSelectMultipleElements;
