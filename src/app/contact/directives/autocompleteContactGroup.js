/* @ngInject */
function autocompleteContactGroup(autocompleteEmailsModel, autocompleteBuilder, dispatchers, contactGroupModel) {
    function exitValidator(value = '') {
        return !!(value.length && contactGroupModel.readName(value));
    }

    const link = (scope, el, { awesomplete, attr }) => {
        const { dispatcher } = dispatchers(['autocompleteEmail']);
        const dispatch = (type, data) => dispatcher.autocompleteEmail(type, data);

        // Model for this autocomplete
        const model = autocompleteEmailsModel([], {
            mode: 'contactGroup'
        });

        /**
         * Sync the model, bind emails selected
         * @return {void}
         */
        const syncModel = (opt) => {
            const hasError = opt.isRequired || opt.doesNotExist;
            scope.$applyAsync(() => {
                scope.email = opt;
                scope.form.$invalid = hasError;
                scope.form.$valid = !hasError;
            });
        };

        const onInput = ({ target }) => {
            // Classic autocompletion
            const { list, hasAutocompletion } = model.filterContact(target.value);
            hasAutocompletion && (awesomplete.list = list);

            // Custom validation to ensure the value is valid
            const val = target.value || '';
            if (!val) {
                return syncModel({ isRequired: true });
            }

            if (!exitValidator(val)) {
                syncModel({
                    isRequired: false,
                    doesNotExist: true
                });
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
        awesomplete.replace = syncModel;

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
            email: '=model',
            form: '=form'
        },
        replace: true,
        templateUrl: require('../../../templates/contact/autocompleteContactGroup.tpl.html'),
        compile: autocompleteBuilder(
            { link },
            {
                data(item) {
                    return {
                        label: item.label,
                        value: {
                            value: item.value,
                            data: {
                                ContactID: item.ContactID
                            }
                        }
                    };
                }
            }
        )
    };
}

export default autocompleteContactGroup;
