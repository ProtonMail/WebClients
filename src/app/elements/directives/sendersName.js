import _ from 'lodash';
import { INBOX } from '../../constants';
/* @ngInject */
function sendersName($filter, $state, dispatchers) {
    const SENDERS_STATE = ['secured.sent', 'secured.allSent', 'secured.drafts', 'secured.allDrafts'];

    return {
        replace: true,
        restrict: 'E',
        template: '<span class="senders-name"></span>',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { ID, ConversationID, Type } = scope.conversation;
            const isMessage = !!ConversationID;
            const currentStateName = $state.$current.name.replace('.element', '');
            const formatList = (list = []) =>
                list.map((contact) => _.unescape($filter('contact')(contact, 'Name'))).join(', ');
            const eventName = isMessage ? 'message.refresh' : 'refreshConversation';

            const build = () => {
                const {
                    Sender,
                    ToList = [],
                    CCList = [],
                    BCCList = [],
                    Recipients = [],
                    Senders = []
                } = scope.conversation;
                const displaySenders = isMessage ? Type === INBOX : !SENDERS_STATE.includes(currentStateName);
                const getSenders = () => (isMessage ? [Sender] : Senders);
                const getRecipients = () => (isMessage ? ToList.concat(CCList, BCCList) : Recipients);

                el[0].textContent = formatList(displaySenders ? getSenders() : getRecipients());
            };

            on(eventName, (e, { type, data }) => {
                if (type === 'refresh' && data.includes(ID)) {
                    build();
                }
            });

            build(); // can be a message or a conversation element

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default sendersName;
