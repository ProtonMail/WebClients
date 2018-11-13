import { REGEX_EMAIL } from '../../constants';

/* @ngInject */
function autocompleteContacts(autocompleteEmailsModel, autocompleteBuilder, dispatchers) {
    const TAB_KEY = 9;
    const COMMA_KEY = 188;
    const CLASS_NO_AUTOCOMPLETE = 'autocompleteContacts-not-exist';

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
        const isNewContact = () => el[0].classList.contains(CLASS_NO_AUTOCOMPLETE);

        // Model for this autocomplete
        const model = autocompleteEmailsModel(scope.list, {
            keyValue: 'ID',
            extraKeys: ['Email'],
            mode: 'contact'
        });

        const syncModel = () => {
            scope.$applyAsync(() => {
                scope.list = model.all();
            });
        };

        /**
         * Check if we need to display the Add new contact card
         * @param  {Boolean} hasAutocompletion
         * @param  {String}  value             Input's value
         * @return {void}
         */
        const showAddContactInfo = (hasAutocompletion, value = '') => {
            if (hasAutocompletion || (!hasAutocompletion && !value.length)) {
                return el[0].classList.remove(CLASS_NO_AUTOCOMPLETE);
            }
            return el[0].classList.add(CLASS_NO_AUTOCOMPLETE);
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

            showAddContactInfo(hasAutocompletion, target.value);

            if (!(target.value || '').includes('@')) {
                return;
            }

            // Unselect the autocomplete suggestion if the input value is a valid email
            if (hasAutocompletion && REGEX_EMAIL.test(target.value)) {
                return awesomplete.goto(-1);
            }
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

            if (!isNewContact()) {
                return;
            }

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
            if (!isNewContact()) {
                model.add(opt);
                this.input.value = '';
                syncModel();
            }
        };

        // Custom filter as the list contains unicode and not the input
        awesomplete.filter = (text, input) => {
            return Awesomplete.FILTER_CONTAINS(text, model.formatInput(input));
        };

        on('contacts', (e, { type }) => {
            if (/^contact(Events|Updated)$/.test(type)) {
                return syncModel(true);
            }

            if (type === 'contactCreated') {
                const value = awesomplete.input.value;
                el[0].classList.remove(CLASS_NO_AUTOCOMPLETE);
                const {
                    list: [contact]
                } = model.filterContact(value);
                model.add({
                    label: contact.label,
                    value: {
                        value: contact.ID,
                        data: {
                            Email: contact.value
                        }
                    }
                });
                awesomplete.input.value = '';
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
            model.clear();
            unsubscribe();
        });
    };

    return {
        scope: {
            list: '='
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
