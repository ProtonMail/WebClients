import { REGEX_EMAIL } from '../../constants';

/* @ngInject */
function autocompleteEmail(autocompleteEmailsModel, autocompleteBuilder, dispatchers) {
    /**
     * Get the selected input value configuration
     * @param  {Object} model Factory autocompleteEmailsModel
     * @param  {String} value Input value
     * @return {Object}       {label, value}
     */
    const getConfigEmailInput = (model, value = '') => {
        if (REGEX_EMAIL.test(value)) {
            const config = model.filterContact(value, true).list[0];
            // Can be undefined if there is no match
            if (config) {
                return config;
            }
        }

        return { label: value, value };
    };

    const link = (scope, el, { awesomplete, attr }) => {
        const { dispatcher } = dispatchers(['autocompleteEmail']);
        const dispatch = (type, data) => dispatcher.autocompleteEmail(type, data);

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
            if ((target.value || '').includes('@')) {
                REGEX_EMAIL.test(target.value) && awesomplete.goto(-1);
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

        const onBlur = () => {
            if (attr.eventType) {
                scope.$applyAsync(() => {
                    dispatch('input.blur', { value: scope.email, type: attr.eventType, eventData: attr.eventData });
                });
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
        el.find('input').on('blur', onBlur);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            el.off('input', onInput);
            el.off('blur', onBlur);
            model.clear();
        });
    };
    return {
        scope: {
            email: '='
        },
        replace: true,
        templateUrl: require('../../../templates/ui/autocompleteEmail.tpl.html'),
        compile: autocompleteBuilder({ link })
    };
}
export default autocompleteEmail;
