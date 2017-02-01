angular.module('proton.sidebar')
    .factory('sidebarModel', (CONSTANTS, tools, cacheCounters, gettextCatalog) => {

        const CONFIG = {
            inbox: {
                state: 'secured.inbox',
                label: gettextCatalog.getString('Inbox', null, 'Title'),
                icon: 'fa-inbox'
            },
            drafts: {
                state: 'secured.drafts',
                label: gettextCatalog.getString('Drafts', null, 'Title'),
                icon: 'fa-file-text-o'
            },
            sent: {
                state: 'secured.sent',
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

        const getStateConfig = () => CONFIG;

        const getFolderID = (mailbox, id) => {
            return (mailbox === 'label') ? id : CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        };

        const getTotal = (mailbox, id) => {
            const type = tools.typeList(mailbox);
            const key = (type === 'conversation') ? 'Conversation' : 'Message';
            return cacheCounters[`unread${key}`](id);
        };

        /**
         * Returns the number of unread messages in a location
         * @param mailbox {String} name indentifier for folder
         * @param id {Integer} labelID for a label
         * @return {Integer}
         */
        const unread = (mailbox, id) => {
            // ==> Move to a model
            const count = getTotal(mailbox, getFolderID(mailbox, id));
            // console.log('Count', count);

            // TODO: THIS IS A BUG WHY IS THIS UNDEFINED!
            if (count === undefined || count <= 0) {
                return '';
            }

            if (count > 1000) {
                return '(999+)';
            }

            return `(${count})`;
        };

        return { unread, getStateConfig };
    });
