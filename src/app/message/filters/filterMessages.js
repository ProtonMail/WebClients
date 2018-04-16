import _ from 'lodash';

/* @ngInject */
function filterMessages($state, $rootScope, CONSTANTS) {
    return (messages = [], showTrashed, showNonTrashed) => {
        if (!$state.includes('secured.search.**') && !$state.includes('secured.label.**') && !$state.includes('secured.starred.**')) {
            const nonTrashed = messages.filter((message) => !_.includes(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));

            if ($state.includes('secured.trash.**') === true) {
                const trashed = messages.filter((message) => _.includes(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash));
                if (showNonTrashed === false) {
                    return trashed;
                }
            } else if (nonTrashed.length > 0) {
                if (showTrashed === false) {
                    return nonTrashed;
                }
            }
        }

        return messages;
    };
}
export default filterMessages;
