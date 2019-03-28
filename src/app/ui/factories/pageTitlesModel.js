import _ from 'lodash';
import { flow, filter, sortBy, head } from 'lodash/fp';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function pageTitlesModel($injector, dispatchers, gettextCatalog, authentication, $state, tools) {
    const DISPLAY_NUMBER = [
        'inbox',
        'drafts',
        'sent',
        'starred',
        'archive',
        'spam',
        'trash',
        'allmail',
        'allDrafts',
        'allSent'
    ];
    const { on } = dispatchers();

    const loadI18N = () => ({
        'eo.message': gettextCatalog.getString('Encrypted Message', null, 'Title'),
        'eo.reply': gettextCatalog.getString('Encrypted Reply', null, 'Title'),
        account: gettextCatalog.getString('Account', null, 'Title'),
        allDrafts: gettextCatalog.getString('Drafts', null, 'Title'),
        allmail: gettextCatalog.getString('All Mail', null, 'Title'),
        allSent: gettextCatalog.getString('Sent', null, 'Title'),
        appearance: gettextCatalog.getString('Appearance', null, 'Title'),
        archive: gettextCatalog.getString('Archive', null, 'Title'),
        autoresponder: gettextCatalog.getString('Automatic Replies', null, 'Title'),
        bridge: gettextCatalog.getString('Bridge IMAP/SMTP', null, 'Title'),
        contact: gettextCatalog.getString('Contact', null, 'Title'),
        contacts: gettextCatalog.getString('Contacts', null, 'Title'),
        contactsCreate: gettextCatalog.getString('Create Contact', null, 'Title'),
        dashboard: gettextCatalog.getString('Dashboard', null, 'Title'),
        domains: gettextCatalog.getString('Domains', null, 'Title'),
        drafts: gettextCatalog.getString('Drafts', null, 'Title'),
        encryption: gettextCatalog.getString('Encryption', null, 'Title'),
        filters: gettextCatalog.getString('Filters', null, 'Title'),
        inbox: gettextCatalog.getString('Inbox', null, 'Title'),
        invoices: gettextCatalog.getString('Invoices', null, 'Title'),
        keys: gettextCatalog.getString('Keys', null, 'Title'),
        labels: gettextCatalog.getString('Labels', null, 'Title'),
        login: gettextCatalog.getString('Login', null, 'Title'),
        members: gettextCatalog.getString('Addresses / Users', null, 'Title'),
        payments: gettextCatalog.getString('Payment methods', null, 'Title'),
        pmme: 'pm.me',
        search: gettextCatalog.getString('Search', null, 'Title'),
        security: gettextCatalog.getString('Security', null, 'Title'),
        sent: gettextCatalog.getString('Sent', null, 'Title'),
        signatures: gettextCatalog.getString('Name / Signature', null, 'Title'),
        signup: gettextCatalog.getString('Signup', null, 'Title'),
        spam: gettextCatalog.getString('Spam', null, 'Title'),
        starred: gettextCatalog.getString('Starred', null, 'Title'),
        trash: gettextCatalog.getString('Trash', null, 'Title'),
        users: gettextCatalog.getString('Users', null, 'Title'),
        vpn: gettextCatalog.getString('VPN', null, 'Title')
    });

    let MAP = loadI18N();

    function getFirstSortedAddresses() {
        return (
            flow(
                filter({ Status: 1, Receive: 1 }),
                sortBy('Order'),
                head
            )($injector.get('addressesModel').get()) || {}
        );
    }

    /**
     * Get the name of a label if there is one
     * @return {String}
     */
    const getLabelState = () => {
        const { Name = '' } = $injector.get('labelsModel').read($state.params.label) || {};
        return Name || gettextCatalog.getString('Label', null, 'Title');
    };

    /**
     * Get computed key name for the cache based on the mode
     * @return {String}
     */
    const getCounterKey = () => {
        if (tools.getTypeList() === 'message') {
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
        const cacheCounters = $injector.get('cacheCounters');

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
        if (_.includes(DISPLAY_NUMBER, mailbox) && n > 0) {
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

    on('i18n', (event, { type }) => {
        if (type === 'load') {
            MAP = loadI18N();
        }
    });

    /**
     * Find the current page title
     * @param  {String} options.name
     * @return {String}
     */
    const find = ({ name } = {}, withEmail = true) => {
        const mailbox = tools.currentMailbox() || tools.filteredState();

        if (/login|reset-password|pre-invite|invite/.test(mailbox || name)) {
            return formatTitle(MAP.login);
        }

        if (/(signup|eo\.|support)/.test(mailbox || name)) {
            return formatTitle(MAP[mailbox || name]);
        }

        if (/contacts.list/.test(mailbox || name)) {
            return formatTitle(MAP.contacts);
        }

        if (/contacts.new/.test(mailbox || name)) {
            return formatTitle(MAP.contactsCreate);
        }

        if (/contacts.detail/.test(mailbox || name)) {
            return formatTitle(MAP.contact);
        }

        const isLabelState = mailbox === 'label';
        const number = formatNumber(getNumberMessage(), mailbox);
        const { Email = '' } = withEmail ? getFirstSortedAddresses() : {};

        if (MAP[mailbox] || isLabelState) {
            const value = !isLabelState ? MAP[mailbox] : getLabelState();
            return formatTitle(value, number, Email);
        }

        return formatTitle(mailbox, number, Email);
    };

    return { find };
}

export default pageTitlesModel;
