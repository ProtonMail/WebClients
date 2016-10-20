angular.module('proton.ui')
.directive('autocompleteEmails', (autocompleteEmailsModel, regexEmail) => {

    const TAB_KEY = 9;
    const BACKSPACE_KEY = 8;
    const COMMA_KEY = 188;

    /**
     * Get the form value (the input value) onSubmit
     * @param  {Node} target
     * @return {String}
     */
    const getFormValue = (target) => {

        const api = {};
        if (target.nodeName === 'FORM') {
            const input = target.querySelector('input');
            return {
                value: input ? input.value : '',
                clear() {
                    input && (input.value = '');
                }
            };
        }

        api.value = target.value;
        api.clear = () => (target.value = '');

        return api;
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
    const splitEmails = (value = '') => value.split(/,|;/).filter(Boolean).map((txt) => txt.trim());


    const link = (scope, el) => {

        // Model for this autocomplete
        const model = autocompleteEmailsModel(scope.emails);

        /**
         * Sync the model, bind emails selected
         * @return {void}
         */
        const syncModel = () => scope.$applyAsync(() => (scope.emails = model.all()));

        /**
         * @link {https://leaverou.github.io/awesomplete/#basic-usage}
         */
        let awesomplete = new Awesomplete(el[0].querySelector('input'), {
            minChars: 1,
            autoFirst: true,
            list: []
        });

        let previousScrollIndex = 0;

        const onHighlight = () => {
            if (previousScrollIndex !== awesomplete.index) {
                previousScrollIndex = awesomplete.index;
                const node = awesomplete.ul.children[previousScrollIndex];
                /**
                 * Compat with Boolean
                 * {@link http://caniuse.com/#search=scrollIntoView}
                 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView}
                 */
                node && node.scrollIntoView(false);
            }
        };

        const onInput = ({ target }) => {
            // Only way to clear the input if you add a comma.
            target.value === ',' && (target.value = '');

            /**
             * If there is something before the comma add it to the selected list
             * Then clear the input, and set the focus onto the input
             */
            if (target.value && isSplitable(target.value)) {
                splitEmails(target.value)
                    .forEach((value) => model.add({ label: value, value }));
                syncModel();
                return _rAF(() => (awesomplete.input.value = '', awesomplete.input.focus()));
            }

            // Classic autocompletion
            const { list, hasAutocompletion } = model.filterContact(target.value);

            hasAutocompletion && (awesomplete.list = list);
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
             *     Display the autocomplete with a list
             */
            if (target.nodeName === 'INPUT' && !target.value) {
                awesomplete.minChars = 0;
                const { list } = model.filterContact(target.value);
                awesomplete.list = list;
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
                const config = regexEmail.test(value) ? model.filterContact(value, true).list[0] : { label: value, value };
                model.add(config);
                clear();
                syncModel();
            }
        };

        const onKeyDown = (e) => {

            const hasAutocompletion = !awesomplete.input.value && !model.isEmpty();

            switch (e.keyCode) {
                case TAB_KEY:
                    // When the autocomplete is opened
                    if (awesomplete.opened) {
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
        awesomplete.input.addEventListener('awesomplete-highlight', onHighlight);
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

        scope
            .$on('$destroy', () => {
                el.off('keydown', onKeyDown);
                el.off('click', onClick);
                el.off('input', onInput);
                el.off('submit', onInput);
                awesomplete.input.removeEventListener('awesomplete-highlight', onHighlight);
                awesomplete = null;
            });
    };

    const compile = () => ({
        pre(scope, element, { name, placeholder = '' }) {
            // Bind self configuration for this input (uniq)
            const $input = element[0].querySelector('input');
            const id = $input.name + Math.random().toString(32).slice(2, 10);
            $input.name = $input.id = (name || id);
            $input.placeholder = placeholder;
        },
        post: link
    });

    return {
        scope: {
            emails: '='
        },
        replace: true,
        templateUrl: 'templates/directives/ui/autocomplete.tpl.html',
        compile
    };
});
