import _ from 'lodash';

import { flow, filter, take, map, sortBy } from 'lodash/fp';

/* @ngInject */
function autocompleteEmailsModel($injector, authentication, regexEmail, checkTypoEmails, $filter, CONSTANTS) {
    const { AUTOCOMPLETE_DOMAINS } = CONSTANTS;
    const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = CONSTANTS.EMAIL_FORMATING;

    let TEMP_LABELS = {};
    const unicodeTagView = $filter('unicodeTagView');

    const getID = () =>
        `${Math.random()
            .toString(32)
            .slice(2, 12)}-${Date.now()}`;

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
            take(CONSTANTS.AWESOMEPLETE_MAX_ITEMS)
        )(AUTOCOMPLETE_DOMAINS);
    };

    /**
     * Format the label of an address to display both the name and the address
     * @param  {String} Name
     * @param  {String} Email
     * @return {String}
     */
    const formatLabel = (Name, Email) => {
        if (Email === Name || !Name) {
            return Email.trim();
        }

        return `${htmlEntities(Name).trim()} ${OPEN_TAG_AUTOCOMPLETE}${Email.trim()}${CLOSE_TAG_AUTOCOMPLETE}`;
    };

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

        const collection = flow(
            map(({ Name, Email }) => {
                const value = Email;
                const label = formatLabel(Name, Email);
                return { label, value, Name };
            }),
            sortBy('label'),
            filter(({ label }) => label.toLowerCase().includes(input)),
            take(CONSTANTS.AWESOMEPLETE_MAX_ITEMS)
        )($injector.get('contactEmails').fetch());

        // it creates a map <escaped>:<label> because the lib does not support more keys than label/value and we need the unescaped value #4901
        TEMP_LABELS = collection.reduce((acc, { label, Name }) => ((acc[label] = Name), acc), {});

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
        if (regexEmail.test(cleanLabel)) {
            const [Name, adr = value] = cleanLabel.split(/<|\(/).map((str = '') => str.trim());
            // If the last >/) does not exist, keep the email intact
            const Address = /(>|\))$/.test(adr) ? adr.slice(0, -1) : adr;
            return { Name, Address };
        }

        return { Name: label.trim(), Address: value.trim() };
    };

    return (previousList = []) => {
        // Prevent empty names if we only have the address (new email, no contact yet for this one)
        let list = angular.copy(previousList).map(({ Address = '', Name = '' }) => ({
            $id: getID(),
            Name: Name || Address,
            Address
        }));

        const all = () => list;
        const clear = () => ((list.length = 0), (TEMP_LABELS = {}));

        /**
         * Add a new contact to the list
         * @param  {String} options.label Label to display
         * @param  {String} options.value Value === email
         * @return {Number}
         */
        const add = ({ label, value } = {}) => {
            const data = formatNewEmail(TEMP_LABELS[label] || label, value);

            // If the mail is not already inside the collection, add it
            if (!list.some(({ Address }) => Address === data.Address)) {
                list.push(
                    _.extend({}, data, {
                        $id: getID(),
                        invalid: !regexEmail.test(data.Address) || checkTypoEmails(data.Address)
                    })
                );
            }
        };

        /**
         * Remove a contact by its address
         * @param  {String} options.Address
         * @return {Array}
         */
        const remove = ({ Address }) => (list = list.filter((item) => item.Address !== Address));

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

        return {
            filterContact,
            formatInput: unicodeTagView,
            all,
            add,
            remove,
            removeLast,
            isEmpty,
            clear
        };
    };
}

export default autocompleteEmailsModel;
