import _ from 'lodash';

/* @ngInject */
function ptSelectMultipleElements($rootScope, AppModel, dispatchers) {
    const CACHE = {};
    const countChecked = (conversations) => _.filter(conversations, { Selected: true }).length;

    /**
     * Select many conversations and update the scope
     * @param  {$scope} scope
     * @return {function}       (previous, from, to)
     */
    function selectConversations(scope) {
        /**
         * Update the scope with selected conversations
         * @param  {Object} previous Previous conversation selected
         * @param  {Number} from     Index conversation
         * @param  {Number} to       Index conversation
         * @return {void}
         */
        return (previous, from, to) => {
            for (let index = from; index < to; index++) {
                scope.conversations[index].Selected = previous.conversation.Selected;
            }

            AppModel.set('numberElementChecked', countChecked(scope.conversations));
        };
    }

    return {
        link(scope, el) {
            let previous = null;
            const conversationsToSelect = selectConversations(scope);
            const { on, unsubscribe } = dispatchers();

            // cache the previous selected items
            on('dnd', (e, { type, data }) => {
                if (type === 'hook.dragstart') {
                    CACHE.number = data.before.number;
                    CACHE.ids = data.before.ids;

                    AppModel.set('numberElementChecked', 1);
                    _.each(scope.conversations, (item) => {
                        item.Selected = false;
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
                    scope.conversations[index].Selected = isChecked;
                    AppModel.set('numberElementChecked', countChecked(scope.conversations));

                    if (shiftKey && previous) {
                        const from = Math.min(index, previous.index);
                        const to = Math.max(index, previous.index);
                        conversationsToSelect(previous, from, to);

                        // Unselect the latest click if we unselect a list of checkbox
                        target.checked = previous.conversation.Selected;
                    }

                    AppModel.set('showWelcome', false);

                    previous = {
                        index,
                        conversation: scope.conversations[index]
                    };
                });
            }

            const onDragEnd = () => {
                _rAF(() => {
                    scope.$applyAsync(() => {
                        _.each(scope.conversations, (item) => {
                            if (CACHE.ids) {
                                item.Selected = CACHE.ids.indexOf(item.ID) !== -1;
                            }
                            // Auto check drag item, we uncheck it at the end
                            if (AppModel.get('numberElementChecked') === 1 && !CACHE.number) {
                                item.Selected = false;
                            }
                        });
                        AppModel.set('numberElementChecked', CACHE.number || countChecked(scope.conversations));

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
