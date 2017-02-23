angular.module('proton.formUtils')
.directive('autocompleteEmail', (autocompleteEmailsModel, regexEmail, autocompleteBuilder) => {

    /**
     * Get the selected input value configuration
     * @param  {Object} model Factory autocompleteEmailsModel
     * @param  {String} value Input value
     * @return {Object}       {label, value}
     */
    const getConfigEmailInput = (model, value = '') => {

        if (regexEmail.test(value)) {
            const config = model.filterContact(value, true).list[0];
            // Can be undefined if there is no match
            if (config) {
                return config;
            }
        }

        return { label: value, value };
    };

    const link = (scope, el, { awesomplete }) => {

        // Model for this autocomplete
        const model = autocompleteEmailsModel();

        /**
         * Sync the model, bind emails selected
         * @return {void}
         */
        const syncModel = ({ value }) => scope.$applyAsync(() => (scope.email = value));

        const onInput = ({ target }) => {

            // Classic autocompletion
            const { list, hasAutocompletion } = model.filterContact(target.value);
            hasAutocompletion && (awesomplete.list = list);

            // Unselect the autocomplete suggestion if the input value is a valid email
            if ((target.value || '').indexOf('@')) {
                regexEmail.test(target.value) && awesomplete.goto(-1);
            }
        };

        const onClick = ({ target }) => {

            // Reset autocomplete to work only after 1 letter
            awesomplete.minChars = 1;

            /**
             * Click onto the empty input
             *     Display the autocomplete with a list
             */
            if (target.nodeName === 'INPUT' && !target.value) {
                awesomplete.minChars = 0;
                const { list, hasAutocompletion } = model.filterContact(target.value);
                hasAutocompletion && (awesomplete.list = list);
            }
        };

        /**
         * Update the model when an user select an option
         */
        awesomplete.replace = function replace(opt) {
            syncModel(getConfigEmailInput(model, opt.value));
        };

        // Custom filter as the list contains unicode and not the input
        awesomplete.filter = (text, input) => {
            return Awesomplete.FILTER_CONTAINS(text, model.formatInput(input));
        };

        el.on('click', onClick);
        el.on('input', onInput);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            el.off('input', onInput);
        });
    };
    return {
        scope: {
            email: '='
        },
        replace: true,
        templateUrl: 'templates/formUtils/autocompleteEmail.tpl.html',
        compile: autocompleteBuilder(link)
    };
});
