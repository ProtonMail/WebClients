import _ from 'lodash';
import { flow, filter, take, map, orderBy } from 'lodash/fp';

import { REGEX_EMAIL, EMAIL_FORMATING, AUTOCOMPLETE_DOMAINS, AWESOMEPLETE_MAX_ITEMS } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = EMAIL_FORMATING;

/* @ngInject */
function autocompleteEmailsModel($injector, authentication, checkTypoEmails, $filter, dispatchers) {
    const unicodeTagView = $filter('unicodeTagView');
    const { on } = dispatchers(['contacts']);

    const CACHE = {
        EMAILS: [],
        LABELS: Object.create(null)
    };

    on('contacts', ({ type }) => {
        /*
            Store a cache to fix perf issue #7520 if we have too much contacts
            we don't need to perform this action every time we do the autocompletion
         */
        if (type === 'contactEmails.updated') {
            CACHE.EMAILS = formatCacheEmails();
        }
    });

    /**
     * @{link https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/}
     */
    const htmlEntities = (str = '') => {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    /**
     * Default formating + sort for contacts emails
     * @return {Array}
     */
    function formatCacheEmails() {
        return flow(
            map(({ Name, Email, LastUsedTime }) => {
                const value = Email;
                const label = formatLabel(Name, Email);
                return { label, value, Name, LastUsedTime };
            }),
            orderBy(['LastUsedTime', 'label'], ['desc', 'asc'])
        )($injector.get('contactEmails').get());
    }

    /**
     * Get a list of default value + most commons domains
     * @param  {String} value
     * @return {Array}
     */
    const defaultDomainsList = (value = '') => {
        const [email, domain = ''] = value.split('@');
        return flow(
            filter((item) => item.includes(domain.toLowerCase())),
            map((domain) => {
                const value = `${email}@${domain}`;
                return { label: value, value, Name: value };
            }),
            take(AWESOMEPLETE_MAX_ITEMS)
        )(AUTOCOMPLETE_DOMAINS);
    };

    /**
     * Format the label of an address to display both the name and the address
     * @param  {String} Name
     * @param  {String} Email
     * @return {String}
     */
    function formatLabel(Name, Email) {
        if (Email === Name || !Name) {
            return Email.trim();
        }

        return `${htmlEntities(Name).trim()} ${OPEN_TAG_AUTOCOMPLETE}${Email.trim()}${CLOSE_TAG_AUTOCOMPLETE}`;
    }

    /**
     * Filter the autocomplete list output
     * @param  {Array}   list
     * @param  {String}  value          Default value if there is no autocomplete
     * @param  {Boolean} strictEquality Return exact match
     * @return {Array}
     */
    const filterList = (list = [], value, strictEquality = false) => {
        const col = list.length ? list : [{ label: value, value }];
        return strictEquality ? _.filter(col, { value }) : col;
    };

    /**
     * Filter emails from our contacts to find by
     *     - Matching name
     *     - Emails starting with
     *
     * List contains available emails or the new one
     * hasAutocompletion if data are coming from us
     * @param  {String} value
     * @param  {Boolean} strictEquality  Filter the collection via ===
     * @return {Object} {list:Array, show:Boolean}
     */
    const filterContact = (val = '', strictEquality = false) => {
        // Do not lowercase value as it might get used by the UI directy via filterList
        const value = unicodeTagView(val.trim());
        const input = value.toLowerCase();

        // Prepare the CACHE if it's not available yet
        if (!CACHE.EMAILS.length) {
            CACHE.EMAILS = formatCacheEmails();
        }

        const collection = flow(
            filter(({ label }) => label.toLowerCase().includes(input)),
            take(AWESOMEPLETE_MAX_ITEMS)
        )(CACHE.EMAILS);

        /*
            it creates a map <escaped>:<label>
            because the lib does not support more keys than label/value
            and we need the unescaped value #4901
         */
        CACHE.LABELS = collection.reduce((acc, { label, Name }) => ((acc[label] = Name), acc), Object.create(null));

        const hasAutocompletion = !!collection.length;

        if (hasAutocompletion) {
            return {
                list: filterList(collection, value, strictEquality),
                hasAutocompletion
            };
        }

        // Display custom domain suggestion if no match
        if (/@$/.test(value)) {
            const list = defaultDomainsList(value);
            return { list, hasAutocompletion: !!list.length };
        }

        return {
            list: [],
            hasAutocompletion: false
        };
    };

    /**
     * Format any new email added to the collection
     * Extract Name and Email from a string
     *     Standard: Name <email>
     *     Outlook 2016: Name (email)
     * @param  {String} label
     * @param  {String} value
     * @return {Object}       {Name, Address}
     */
    const formatNewEmail = (label, value) => {
        // We need to clean the label because the one comming from the autocomplete can contains some unicode
        const cleanLabel = $filter('chevrons')(label);

        // Check if an user paste an email Name <email> || Name (email)
        if (REGEX_EMAIL.test(cleanLabel)) {
            const [Name, adr = value] = cleanLabel.split(/<|\(/).map((str = '') => str.trim());
            // If the last >/) does not exist, keep the email intact
            const Address = /(>|\))$/.test(adr) ? adr.slice(0, -1) : adr;
            return { Name, Address };
        }

        return { Name: label.trim(), Address: value.trim() };
    };

    return (previousList = []) => {
        // Prevent empty names if we only have the address (new email, no contact yet for this one)
        let list = [];

        const all = () => list;
        const exist = (value) => list.some(({ Address }) => Address === value);
        const clear = () => {
            list.length = 0;
            CACHE.LABELS = Object.create(null);
        };

        /**
         * Add new email to the list
         * @param {Object} data email Object
         */
        const addEmail = (data = {}) => {
            // If the mail is not already inside the collection, add it
            if (!exist(data.Address)) {
                list.push(data);
            }
        };

        /**
         * Add a new contact to the list
         * @param  {String} options.label Label to display
         * @param  {String} options.value Value === email
         * @return {Number}
         */
        const add = ({ label, value } = {}) => {
            const data = formatNewEmail(CACHE.LABELS[label] || label, value);
            addEmail(data);
        };

        /**
         * Remove a contact by its address
         * @param  {String} options.Address
         * @return {Array}
         */
        const remove = (cb) => ((list = list.filter(cb)), list);
        const removeByAddress = (Address) => remove(({ Address: otherAddress }) => otherAddress !== Address);

        /**
         * Update an address. Ensures that the list is still unique. If new address already exists, the old address will be removed.
         * @param {String} oldAddress
         * @param {String} newAddress
         * @param {String} newName
         */
        const updateEmail = (oldAddress, newAddress, newName) => {
            // If the address has been updated, ensure that it is unique. If it already exists,
            // delete the old address.
            if (oldAddress !== newAddress && list.some((email) => email.Address === newAddress)) {
                removeByAddress(oldAddress);
                return;
            }
            // Update the old Address with the new information.
            list = list.map((email) => {
                if (email.Address === oldAddress) {
                    return {
                        ...email,
                        Address: newAddress,
                        Name: newName
                    };
                }
                return email;
            });
        };

        /**
         * Remove the last contact from the list
         * @return {Array}
         */
        const removeLast = () => (list.pop(), list);

        /**
         * Check if there are contacts inside the collection
         * @return {Boolean}
         */
        const isEmpty = () => !list.length;

        /**
         * Refresh model list by comparing with an other list
         * @param  {Array}  emails [ { Name, Address } ]
         */
        const refresh = (emails = []) => {
            const removeMap = _.keyBy(emails, 'Address');
            const addMap = _.keyBy(list, 'Address');

            // Remove missing email first
            list = list.filter(({ Address }) => removeMap[Address]);
            // Then add new one
            emails.forEach((email) => {
                if (!addMap[email.Address]) {
                    addEmail(email);
                }
            });
        };

        previousList.forEach(({ Address = '', Name = '' }) =>
            addEmail({
                Name: Name || Address,
                Address
            })
        );

        return {
            filterContact,
            formatInput: unicodeTagView,
            all,
            add,
            remove,
            removeByAddress,
            removeLast,
            updateEmail,
            isEmpty,
            clear,
            exist,
            refresh
        };
    };
}

export default autocompleteEmailsModel;
