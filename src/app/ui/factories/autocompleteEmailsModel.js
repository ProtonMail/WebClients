angular.module('proton.ui')
    .factory('autocompleteEmailsModel', (authentication, regexEmail) => {

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
                    const label = (Email === Name) ? Email : `${Name} (${Email})`;
                    return { label, value };
                })
                .value();

            const list = collection.length ? collection : [{ label: value, value}];

            return {
                list,
                hasAutocompletion: !!collection.length
            };
        };

        return (previousList = []) => {

            let list  = angular.copy(previousList);

            const all = () => list;

            /**
             * Add a new contact to the list
             * @param  {String} options.label Label to display
             * @param  {String} options.value Value === email
             * @return {Number}
             */
            const add = ({ label, value } = {}) => {
                const data = {
                    Name: label,
                    Address: value,
                    invalid: !regexEmail.test(value)
                };

                // If the mail is not already inside the collection, add it
                (!list.some(({ Address }) => Address === value)) && list.push(data);
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
