angular.module('proton.ui')
    .factory('pageTitlesModel', (CONSTANTS, cacheCounters, gettextCatalog, authentication, $state, tools) => {

        const { MAILBOX_IDENTIFIERS } = CONSTANTS;
        const DISPLAY_NUMBER = ['inbox', 'drafts', 'sent', 'starred', 'archive', 'spam', 'trash'];
        const MAP = {
            inbox: gettextCatalog.getString('Inbox', null, 'Title'),
            search: gettextCatalog.getString('Search', null, 'Title'),
            drafts: gettextCatalog.getString('Drafts', null, 'Title'),
            sent: gettextCatalog.getString('Sent', null, 'Title'),
            starred: gettextCatalog.getString('Starred', null, 'Title'),
            archive: gettextCatalog.getString('Archive', null, 'Title'),
            spam: gettextCatalog.getString('Spam', null, 'Title'),
            trash: gettextCatalog.getString('Trash', null, 'Title'),
            contacts: gettextCatalog.getString('Contacts', null, 'Title'),
            dashboard: gettextCatalog.getString('Dashboard', null, 'Title'),
            account: gettextCatalog.getString('Account', null, 'Title'),
            labels: gettextCatalog.getString('Labels', null, 'Title'),
            security: gettextCatalog.getString('Security', null, 'Title'),
            appearance: gettextCatalog.getString('Appearance', null, 'Title'),
            domains: gettextCatalog.getString('Domains', null, 'Title'),
            users: gettextCatalog.getString('Users', null, 'Title'),
            invoices: gettextCatalog.getString('Invoices', null, 'Title'),
            filters: gettextCatalog.getString('Filters', null, 'Title'),
            keys: gettextCatalog.getString('Keys', null, 'Title'),
            payments: gettextCatalog.getString('Payment methods', null, 'Title'),
            addresses: gettextCatalog.getString('Addresses', null, 'Title'),
            login: gettextCatalog.getString('Login', null, 'Title'),
            signup: gettextCatalog.getString('Signup', null, 'Title')
        };

        function getFirstSortedAddresses() {
            return _.chain(authentication.user.Addresses)
                .where({ Status: 1, Receive: 1 })
                .sortBy('Send')
                .first()
                .value() || {};
        }

        /**
         * Get the name of a label if there is one
         * @return {String}
         */
        const getLabelState = () => {
            const { Name = '' } = _.findWhere(authentication.user.Labels, { ID: $state.params.label }) || {};

            return Name || gettextCatalog.getString('Label', null, 'Title');
        };

        /**
         * Get computed key name for the cache based on the mode
         * @return {String}
         */
        const getCounterKey = () => {
            if (tools.typeList() === 'message') {
                return 'unreadMessage';
            }
            return 'unreadConversation';
        };

        /**
         * Count the number of message unread we have
         * @return {Number}
         */
        const getNumberMessage = () => {
            const mailbox = tools.currentMailbox();

            if (mailbox === 'drafts') {
                return cacheCounters.unreadMessage(MAILBOX_IDENTIFIERS[mailbox]);
            }
            if (mailbox === 'label') {
                return cacheCounters[getCounterKey()]($state.params.label);
            }

            return cacheCounters[getCounterKey()](MAILBOX_IDENTIFIERS[mailbox]);
        };

        /**
         * Format the number of unread message for states which can display it
         * @param  {Number} n
         * @param  {String} mailbox
         * @return {String}
         */
        const formatNumber = (n, mailbox) => {
            if (_.contains(DISPLAY_NUMBER, mailbox) && n) {
                return `(${n})`;
            }
            return '';
        };

        /**
         * Format the APP title to display
         * @param  {String} mailbox
         * @param  {String} number
         * @param  {String} Email
         * @return {String}
         */
        const formatTitle = (mailbox = '', number = '', Email = '') => {
            return [`${number} ${mailbox}`, Email, 'ProtonMail']
                .map((input) => input.trim())
                .filter(Boolean)
                .join(' | ');
        };

        /**
         * Find the current page title
         * @param  {String} options.name
         * @return {String}
         */
        const find = ({ name } = {}) => {
            const mailbox = tools.currentMailbox() || tools.filteredState();

            if (/login|reset-password/.test(mailbox || name)) {
                return formatTitle(MAP.login);
            }

            const isLabelState = mailbox === 'label';
            const number = formatNumber(getNumberMessage(), mailbox);
            const { Email = '' } = getFirstSortedAddresses();

            if (MAP[mailbox] || isLabelState) {
                const value = !isLabelState ? MAP[mailbox] : getLabelState();
                return formatTitle(value, number, Email);
            }

            return formatTitle(mailbox, number, Email);
        };

        return { find };

    });
