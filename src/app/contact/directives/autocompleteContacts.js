import { REGEX_EMAIL } from '../../constants';

/* @ngInject */
function autocompleteContacts(autocompleteEmailsModel, autocompleteBuilder, dispatchers) {
    const TAB_KEY = 9;
    const COMMA_KEY = 188;

    /**
     * Get the selected input value configuration
     * @param  {Object} model Factory autocompleteEmailsModel
     * @param  {String} value Input value
     * @return {Object}       {label, value}
     */
    const getConfigEmailInput = (model, value = '') => {
        if (REGEX_EMAIL.test(value)) {
            const [config] = model.filterContact(value, true).list;
            // Can be undefined if there is no match
            if (config) {
                return config;
            }
        }
    };

    /**
     * Get the form value (the input value) onSubmit
     * @param  {Node} target
     * @return {String}
     */
    const getFormValue = (target) => {
        if (target.nodeName === 'FORM') {
            const input = target.querySelector('input');
            return {
                value: (input ? input.value : '').trim(),
                clear() {
                    input && (input.value = '');
                }
            };
        }

        return {
            value: (target.value || '').trim(),
            clear() {
                target.value = '';
            }
        };
    };

    /**
     * Check if an input value is splitable, which means it contains emails
     * separated by a , or ;
     * @param  {String} value
     * @return {Boolean}
     */
    const isSplitable = (value = '') => value.indexOf(',') > -1 || value.indexOf(';') > -1;

    /**
     * Split emails separated by , or ;
     * @param  {String} value
     * @return {Array}
     */
    const splitEmails = (value = '') =>
        value
            .split(/,|;/)
            .filter(Boolean)
            .map((txt) => txt.trim());

    const link = (scope, el, { awesomplete }) => {
        const { on, unsubscribe } = dispatchers();

        scope.emails = [];

        // Model for this autocomplete
        const model = autocompleteEmailsModel(scope.list, {
            keyValue: 'ID',
            extraKeys: ['Email'],
            mode: 'contact'
        });

        const syncModel = (opt = {}, refresh = true) => {
            const hasError = opt.doesNotExist;
            scope.$applyAsync(() => {
                refresh && (scope.list = model.all());
                scope.email = opt;
                scope.form.$invalid = hasError;
                scope.form.$valid = !hasError;
            });
        };

        const onInput = ({ target }) => {
            // Only way to clear the input if you add a comma.
            target.value === ',' && (target.value = '');

            /**
             * If there is something before the comma add it to the selected list
             * Then clear the input, and set the focus onto the input
             */
            if (target.value && isSplitable(target.value)) {
                const emails = splitEmails(target.value);
                emails.forEach((value) => model.add({ label: value, value }));
                syncModel();
                return _rAF(() => ((awesomplete.input.value = ''), awesomplete.input.focus()));
            }

            // Classic autocompletion
            const { list, hasAutocompletion } = model.filterContact(target.value);
            hasAutocompletion && (awesomplete.list = list);
            const value = target.value || '';

            if (value && !hasAutocompletion) {
                return syncModel({
                    doesNotExist: true
                });
            }

            syncModel({}, false);
        };

        const onClick = ({ target }) => {
            // Reset autocomplete to work only after 1 letter
            awesomplete.minChars = 1;

            /**
             * Click onto the empty input
             * Display the autocomplete with a list
             */
            if (target.nodeName === 'INPUT' && !target.value) {
                awesomplete.minChars = 0;
                const { list, hasAutocompletion } = model.filterContact(target.value);

                hasAutocompletion && (awesomplete.list = list);
            }
        };

        /**
         * Autodetect the value of the input if you fill it without
         * the autocomplete
         * @param  {Event} e
         * @return {void}
         */
        const onSubmit = (e) => {
            e.preventDefault();

            const { value, clear } = getFormValue(e.target);

            if (value) {
                const config = getConfigEmailInput(model, value);

                if (!config) {
                    return;
                }
                model.add(config);
                clear();
                syncModel();
                awesomplete.close();
            }
        };

        const onKeyDown = (e) => {
            switch (e.keyCode) {
                case TAB_KEY:
                    // When the autocomplete is opened and selected
                    if (awesomplete.opened && awesomplete.selected) {
                        e.preventDefault();
                        awesomplete.select();
                        return _rAF(() => awesomplete.input.focus());
                    }

                    // Default case, when you add someting inside the input
                    awesomplete.input.value && onSubmit(e);
                    break;

                // Prevent autoselect if you press MAJ + COMMA (< for QWERTY)
                case COMMA_KEY && !e.shiftKey:
                    awesomplete.select();
                    break;
            }
        };

        /**
         * Update the model when an user select an option
         */
        awesomplete.replace = function replace(opt) {
            model.add(opt);
            this.input.value = '';
            syncModel();
        };

        // Custom filter as the list contains unicode and not the input
        awesomplete.filter = (text, input) => {
            return Awesomplete.FILTER_CONTAINS(text, model.formatInput(input));
        };

        on('contacts', (e, { type }) => {
            if (/^contact(Events|Updated)$/.test(type)) {
                return syncModel(true);
            }
        });

        on('contactGroupModel', (event, { type, data }) => {
            if (type !== 'cache.remove') {
                return;
            }
            data.forEach(model.removeItem);
        });

        el.on('keydown', onKeyDown);
        el.on('click', onClick);
        el.on('input', onInput);
        el.on('submit', onSubmit);

        scope.$on('$destroy', () => {
            el.off('keydown', onKeyDown);
            el.off('click', onClick);
            el.off('input', onInput);
            el.off('submit', onSubmit);
            unsubscribe();
            model.clear();
        });
    };

    return {
        scope: {
            list: '=',
            form: '='
        },
        replace: true,
        templateUrl: require('../../../templates/contact/autocompleteContacts.tpl.html'),
        compile: autocompleteBuilder(
            { link },
            {
                data(item) {
                    return {
                        label: item.label,
                        value: {
                            value: item.ID,
                            data: {
                                Email: item.value
                            }
                        }
                    };
                }
            }
        )
    };
}
export default autocompleteContacts;
