import _ from 'lodash';
import { INBOX } from '../../constants';
/* @ngInject */
function sendersName($filter, $state, dispatchers) {
    const SENDERS_STATE = ['secured.sent', 'secured.allSent', 'secured.drafts', 'secured.allDrafts'];

    const formatList = (list = []) => {
        return list.reduce(
            (acc, contact) => {
                acc.title.push(contact.Address);
                acc.content.push(_.unescape($filter('contact')(contact, 'Name')));
                return acc;
            },
            {
                title: [],
                content: []
            }
        );
    };

    return {
        replace: true,
        restrict: 'E',
        template: '<span class="senders-name"></span>',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { ID, ConversationID, Type } = scope.conversation;
            const isMessage = !!ConversationID;
            const currentStateName = $state.$current.name.replace('.element', '');
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
                const { title, content } = formatList(displaySenders ? getSenders() : getRecipients());

                el[0].title = title.join(', ');
                el[0].textContent = content.join(', ');
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
