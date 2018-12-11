import _ from 'lodash';

import { isReceived } from '../../../helpers/message';

/* @ngInject */
function sendersName($filter, $state, dispatchers, recipientsFormator) {
    const contactFilter = $filter('contact');
    const SENDERS_STATE = ['secured.sent', 'secured.allSent', 'secured.drafts', 'secured.allDrafts'];

    const formatList = (list = []) => {
        return list.reduce(
            (acc, contact) => {
                acc.title.push(contact.Address);
                acc.content.push(_.unescape(contactFilter(contact, 'Name')));
                return acc;
            },
            {
                title: [],
                content: []
            }
        );
    };

    const getRecipients = (element, isMessage) => {
        if (isMessage) {
            return element.Recipients;
        }
        return recipientsFormator.toList(element);
    };

    return {
        replace: true,
        restrict: 'E',
        template: '<span class="senders-name"></span>',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { ID, ConversationID } = scope.conversation;
            const isMessage = !!ConversationID;
            const eventName = isMessage ? 'message.refresh' : 'refreshConversation';
            const currentStateName = $state.$current.name.replace('.element', '');
            const displaySenders = isMessage
                ? isReceived(scope.conversation)
                : !SENDERS_STATE.includes(currentStateName);

            const build = () => {
                const { Sender, Senders = [] } = scope.conversation;
                const getSenders = () => (isMessage ? [Sender] : Senders);
                const list = displaySenders ? getSenders() : getRecipients(scope.conversation, isMessage);
                const { title, content } = formatList(list);

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
