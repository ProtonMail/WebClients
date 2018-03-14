import { REGEX_EMAIL } from '../../constants';

/* @ngInject */
function autocompleteEmails($rootScope, autocompleteEmailsModel, autocompleteBuilder) {
    const TAB_KEY = 9;
    const BACKSPACE_KEY = 8;
    const COMMA_KEY = 188;
    const ESCAPE_KEY = 27;

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
        scope.emails = [];
        const $list = el[0].querySelector('.autocompleteEmails-admin');

        // Model for this autocomplete
        const model = autocompleteEmailsModel(scope.list);

        /**
         * Sync the model, bind emails selected
         * @return {void}
         */
        const syncModel = () =>
            scope.$applyAsync(() => {
                scope.emails = model.all();
                scope.list = model.all();
                // Auto scroll to the end of the list
                _rAF(() => ($list.scrollTop = $list.scrollHeight + 32));
            });
        syncModel();

        const onInput = ({ target }) => {
            // Only way to clear the input if you add a comma.
            target.value === ',' && (target.value = '');

            /**
             * If there is something before the comma add it to the selected list
             * Then clear the input, and set the focus onto the input
             */
            if (target.value && isSplitable(target.value)) {
                splitEmails(target.value).forEach((value) => model.add({ label: value, value }));
                syncModel();
                return _rAF(() => ((awesomplete.input.value = ''), awesomplete.input.focus()));
            }

            // Classic autocompletion
            const { list, hasAutocompletion } = model.filterContact(target.value);

            hasAutocompletion && (awesomplete.list = list);

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

            // Click onto a remove button
            if (target.classList.contains('autocompleteEmails-btn-remove')) {
                const { address } = target.dataset;
                model.remove({ Address: address });
                return syncModel();
            }

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
                model.add(getConfigEmailInput(model, value));
                clear();
                syncModel();
                awesomplete.close();
            }
        };

        const onKeyDown = (e) => {
            const hasAutocompletion = !awesomplete.input.value && !model.isEmpty();

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

                case ESCAPE_KEY:
                    // Close the composer if no autocompletion
                    if (!hasAutocompletion) {
                        $rootScope.$emit('composer.update', {
                            type: 'escape.autocomplete'
                        });
                    }
                    break;

                case BACKSPACE_KEY:
                    // Remove last autocomplete only if input is empty and list is not
                    if (hasAutocompletion) {
                        model.removeLast();
                        syncModel();
                    }
                    break;
            }
        };

        /**
         * Auto scroll will be available with the 1.2
         * Patch extracted from {@link https://github.com/LeaVerou/awesomplete/issues/16875}
         */
        awesomplete.input.addEventListener('blur', onSubmit);
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

        el.on('keydown', onKeyDown);
        el.on('click', onClick);
        el.on('input', onInput);
        el.on('submit', onSubmit);

        scope.$on('$destroy', () => {
            el.off('keydown', onKeyDown);
            el.off('click', onClick);
            el.off('input', onInput);
            el.off('submit', onSubmit);
            awesomplete.input.removeEventListener('blur', onSubmit);
            model.clear();
        });
    };
    return {
        scope: {
            list: '=emails'
        },
        replace: true,
        templateUrl: require('../../../templates/ui/autocompleteEmails.tpl.html'),
        compile: autocompleteBuilder(link)
    };
}
export default autocompleteEmails;
