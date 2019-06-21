import _ from 'lodash';

/* @ngInject */
function labelsElement(dispatchers, labelsModel, authentication, $state, contactGroupModel) {
    const HIDE_CLASSNAME = 'labelsElement-hidden';

    const toLabels = (list = [], type) => {
        const getLabel = (id) => {
            const service = !type ? labelsModel : contactGroupModel;
            return service.read(id, 'labels');
        };

        return list.reduce((acc, id) => {
            const item = getLabel(id);
            item && acc.push(item);
            return acc;
        }, []);
    };

    const moreVisibility = (node) => ({
        hide() {
            node.classList.add(HIDE_CLASSNAME);
        },
        show() {
            _rAF(() => node.classList.remove(HIDE_CLASSNAME));
        }
    });

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/elements/labelsElement.tpl.html'),
        replace: true,
        scope: {
            element: '='
        },
        link(scope, el, { limit = 4, type }) {
            const { dispatcher, on, unsubscribe } = dispatchers(['messageActions']);
            const moreToggle = moreVisibility(el[0].querySelector('.labelsElement-more'));

            const build = ({ LabelIDs = [], Labels = [] }) => {
                moreToggle.hide();
                // Check if there is custom labels
                if (LabelIDs.length || Labels.length) {
                    const labelIDs = Labels.length ? _.map(Labels, ({ ID }) => ID) : LabelIDs;
                    const labels = toLabels(labelIDs, type);

                    if (limit !== 'none') {
                        scope.labels = labels.length ? angular.copy(labels.slice(0, limit)) : [];
                        labels.length > limit && moreToggle.show();
                        return;
                    }

                    scope.labels = angular.copy(labels);
                }
            };

            const onClick = (e) => {
                e.stopPropagation();

                if (e.target.classList.contains('labelsElement-label')) {
                    const label = e.target.getAttribute('data-label-id');
                    $state.go('secured.label', { label });
                }

                if (e.target.classList.contains('labelsElement-btn-remove')) {
                    dispatcher.messageActions('unlabel', {
                        messageID: scope.element.ID,
                        conversationID: scope.element.ConversationID,
                        labelID: e.target.getAttribute('data-label-id')
                    });
                }
            };

            on('labelsElement', (event, { data: element }) => {
                if (element.ID === scope.element.ID) {
                    build(element);
                }
            });

            build(scope.element);
            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default labelsElement;
