angular.module('proton.ui')
    .factory('autocompleteEmailsModel', (authentication, regexEmail, $filter, CONSTANTS) => {

        const {
            OPEN_TAG_AUTOCOMPLETE,
            CLOSE_TAG_AUTOCOMPLETE,
            OPEN_TAG_AUTOCOMPLETE_RAW,
            CLOSE_TAG_AUTOCOMPLETE_RAW
        } = CONSTANTS.EMAIL_FORMATING;

        const matchEscapeAutocomplete = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE_RAW}|${CLOSE_TAG_AUTOCOMPLETE_RAW}`, 'ig');

        const MAP_TAGS = {
            [OPEN_TAG_AUTOCOMPLETE_RAW]: OPEN_TAG_AUTOCOMPLETE,
            [CLOSE_TAG_AUTOCOMPLETE_RAW]: CLOSE_TAG_AUTOCOMPLETE
        };

        /**
         * Format the label of an address to display both the name and the address
         * @param  {String} Name
         * @param  {String} Email
         * @return {String}
         */
        const formatLabel = (Name, Email) => {
            if (Email === Name || !Name) {
                return Email;
            }

            return `${Name} ${OPEN_TAG_AUTOCOMPLETE}${Email}${CLOSE_TAG_AUTOCOMPLETE}`;
        };

        /**
         * Replace unicode with <>
         * @param  {String} input
         * @return {String}
         */
        const relaceTagAutocomplete = (input = '') => {
            return input
                .replace(matchEscapeAutocomplete(), (match) => MAP_TAGS[match] || '');
        };

        /**
         * Filter emails from our contacts to find by
         *     - Matching name
         *     - Emails starting with
         *
         * List contains available emails or the new one
         * hasAutocompletion if data are coming from us
         * @param  {String} value
         * @return {Object} {list:Array, show:Boolean}
         */
        const filterContact = (val = '') => {

            const value = relaceTagAutocomplete(val.toLowerCase().trim());
            const collection = _.chain(authentication.user.Contacts)
                .map(({ Name, Email }) => {
                    const value = Email;
                    const label = formatLabel(Name, Email);
                    return { label, value };
                })
                .filter(({ label }) => label.toLowerCase().includes(value))
                .first(10)
                .value();

            const list = collection.length ? collection : [{ label: value, value }];

            return {
                list,
                hasAutocompletion: !!collection.length
            };
        };

        /**
         * Format any new email added to the collection
         * @param  {String} label
         * @param  {String} value
         * @return {Object}       {Name, Address}
         */
        const formatNewEmail = (label, value) => {

            // We need to clean the label because the one comming from the autocomplete can contains some unicode
            const cleanLabel = $filter('chevrons')(label);

            // Check if an user paste an email Name <email>
            if (regexEmail.test(cleanLabel)) {
                const [ Name, adr = value ] = cleanLabel
                    .split('<')
                    .map((str = '') => str.trim());

                // If the last > does not exist, keep the email intact
                const Address = (adr.indexOf('>') === (adr.length - 1)) ? adr.slice(0, -1) : adr;

                return { Name, Address };
            }

            return { Name: label.trim(), Address: value.trim() };
        };

        return (previousList = []) => {

            // Prevent empty names if we only have the address (new email, no contact yet for this one)
            let list = angular.copy(previousList)
                .map(({ Address = '', Name = '' }) => ({ Name: Name || Address, Address }));

            const all = () => list;

            /**
             * Add a new contact to the list
             * @param  {String} options.label Label to display
             * @param  {String} options.value Value === email
             * @return {Number}
             */
            const add = ({ label, value } = {}) => {

                const data = formatNewEmail(label, value);

                // If the mail is not already inside the collection, add it
                if (!list.some(({ Address }) => Address === data.Address)) {
                    list.push(angular.extend({}, data, {
                        invalid: !regexEmail.test(data.Address)
                    }));
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
                formatInput: relaceTagAutocomplete,
                all, add, remove, removeLast, isEmpty
            };
        };
    });
