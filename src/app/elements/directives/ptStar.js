import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function ptStar(dispatchers, tools, actionConversation) {
    /**
     * Check in LabelIDs and Labels to see if the conversation or message is starred
     * @param {Object} item
     */
    function isStarred({ LabelIDs = [], Labels = [] }) {
        if (Labels.length) {
            return _.find(Labels, { ID: MAILBOX_IDENTIFIERS.starred });
        }
        return LabelIDs.some((label) => label === MAILBOX_IDENTIFIERS.starred);
    }

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/elements/ptStar.tpl.html'),
        link(scope, el, attr) {
            const { dispatcher, on, unsubscribe } = dispatchers(['messageActions']);
            const type = attr.ptStarType || tools.getTypeList();

            scope.isStarred = () => isStarred(scope.model);

            /**
             * Star or unstar a message/conversation
             * @param {Object} element - conversation or message
             * @param {String} type Type of message, conversation or message
             */
            function toggleStar({ model, type }) {
                const action = isStarred(model) ? 'unstar' : 'star';

                if (type === 'conversation') {
                    actionConversation[action]([model.ID]);
                }

                if (type === 'message') {
                    dispatcher.messageActions(action, { ids: [model.ID] });
                }
            }

            function onClick(e) {
                if (e.target.nodeName === 'A') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleStar({ model: scope.model, type });
                }
            }

            on('elements', (e, { type, data = {} }) => {
                if (type === 'toggleStar') {
                    toggleStar(data);
                }
            });

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('click', onClick);
            });
        }
    };
}
export default ptStar;
