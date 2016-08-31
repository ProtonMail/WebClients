angular.module('proton.ui')
    .factory('autocompleteEmailsModel', (authentication, regexEmail, $filter) => {

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

            const value = val.toLowerCase();
            const collection = _.chain(authentication.user.Contacts)
                .filter(({ Name, Email}) => {
                    const containsName = Name.toLowerCase().indexOf(value) !== -1;
                    const containsEmail = Email.toLowerCase().indexOf(value) !== -1;

                    return containsName || containsEmail;
                })
                .first(10)
                .map(({ Name, Email }) => {
                    const value = Email;
                    const label = (Email === Name || !Name) ? Email : `${Name} 	‹${Email}›`;
                    return { label, value };
                })
                .value();

            const list = collection.length ? collection : [{ label: value, value}];

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

            return { Name: label, Address: value };
        };

        return (previousList = []) => {

            // Prevent empty names if we only have the address (new email, no contact yet for this one)
            let list  = angular.copy(previousList)
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
                    list.push(angular.extend({}, data , {
                        invalid: !regexEmail.test(data.Address)
                    }));
                }
            };

            /**
             * Remove a contact by its address
             * @param  {String} options.Address
             * @return {Array}
             */
            const remove = ({ Address }) => list = list.filter((item) => item.Address !== Address);

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
                all, add, remove, removeLast, isEmpty
            };
        };
    });
