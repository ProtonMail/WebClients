angular.module('proton.sidebar')
    .factory('sidebarModel', (authentication, CONSTANTS, tools, cacheCounters, gettextCatalog) => {
        const draftsIncluded = () => authentication.user.Moved & 1;
        const sentIncluded = () => authentication.user.Moved & 2;

        const getStateConfig = () => {
            const defaultDrafts = draftsIncluded() ? 'secured.allDrafts' : 'secured.drafts';
            const defaultSent = sentIncluded() ? 'secured.allSent' : 'secured.sent';

            return {
                inbox: {
                    state: 'secured.inbox',
                    label: gettextCatalog.getString('Inbox', null, 'Title'),
                    icon: 'fa-inbox'
                },
                drafts: {
                    state: defaultDrafts,
                    states: ['secured.allDrafts', 'secured.drafts'],
                    label: gettextCatalog.getString('Drafts', null, 'Title'),
                    icon: 'fa-file-text-o'
                },
                sent: {
                    state: defaultSent,
                    states: ['secured.allSent', 'secured.sent'],
                    label: gettextCatalog.getString('Sent', null, 'Title'),
                    icon: 'fa-send'
                },
                starred: {
                    state: 'secured.starred',
                    label: gettextCatalog.getString('Starred', null, 'Title'),
                    icon: 'fa-star-o'
                },
                archive: {
                    state: 'secured.archive',
                    label: gettextCatalog.getString('Archive', null, 'Title'),
                    icon: 'fa-archive'
                },
                spam: {
                    state: 'secured.spam',
                    label: gettextCatalog.getString('Spam', null, 'Title'),
                    icon: 'fa-ban'
                },
                trash: {
                    state: 'secured.trash',
                    label: gettextCatalog.getString('Trash', null, 'Title'),
                    icon: 'fa-trash-o'
                },
                allmail: {
                    state: 'secured.allmail',
                    label: gettextCatalog.getString('All Mail', null, 'Title')
                }
            };
        };

        const getFolderID = (mailbox, id) => {
            return (mailbox === 'label') ? id : CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        };

        const getTotal = (mailbox, id) => {
            const type = tools.getTypeList(mailbox);
            const key = (type === 'conversation') ? 'Conversation' : 'Message';
            return cacheCounters[`unread${key}`](id);
        };

        const renameMailbox = (mailbox) => {
            if (mailbox === 'sent') {
                return sentIncluded() ? 'allSent' : 'sent';
            }

            if (mailbox === 'drafts') {
                return draftsIncluded() ? 'allDrafts' : 'drafts';
            }

            return mailbox;
        };

        /**
         * Returns the number of unread messages in a location
         * @param mailbox {String} name indentifier for folder
         * @param id {Integer} labelID for a label
         * @return {Integer}
         */
        const unread = (mailbox, id) => {
            const mailboxConverted = renameMailbox(mailbox);
            // ==> Move to a model
            const count = getTotal(mailboxConverted, getFolderID(mailboxConverted, id));

            // TODO: THIS IS A BUG WHY IS THIS UNDEFINED!
            if (count === undefined || count <= 0) {
                return '';
            }

            return `(${count})`;
        };

        return { unread, getStateConfig };
    });
