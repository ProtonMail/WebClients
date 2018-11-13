import _ from 'lodash';

/* @ngInject */
function autocompleteCommand(autocompleteBuilder, autocompleteCommandModel, AppModel) {
    const BACKSPACE_KEY = 8;
    const ESCAPE_KEY = 27;
    const SPACE_KEY = 32;

    const link = (scope, el, { awesomplete }) => {
        const mode = {};
        awesomplete.minChars = 0;

        const isModeLabels = () => /^(labels|folders)$/.test(mode.value || '');
        const resetMode = () => Object.keys(mode).forEach((key) => (mode[key] = null));
        const refreshList = (list = autocompleteCommandModel.all()) => {
            awesomplete.list = list;
            awesomplete.open();
            awesomplete.evaluate();
        };

        const bindMode = () => scope.$applyAsync(() => (scope.mode = { value: mode.value }));
        const hide = () => {
            scope.$applyAsync(() => {
                scope.isVisible = false;
                AppModel.set('commandPalette', false);
            });
        };

        const clearValue = (list) => {
            scope.$applyAsync(() => {
                scope.value = '';
                _rAF(() => (refreshList(list), (awesomplete.input.value = '')));
            });
        };

        /*
                We need to refresh the list and set the focus on every toggle
             */
        scope.$watch('isVisible', (value) => {
            if (value) {
                refreshList();
                _rAF(() => awesomplete.goto(0));
            }
        });

        /**
         * Format the list if we choose to add/remove a label
         * else dispatch a command
         * @return {void}
         */
        const action = ({ value, label }) => {
            /* eslint no-underscore-dangle: "off" */
            mode.key = (_.find(awesomplete._list, { value, label }) || {}).key;

            if (/^(add|remove)\.(label|folder)$/.test(value)) {
                const [type = '', match = ''] = value.split('.');
                mode.value = `${match}s`;
                mode.type = type;
                clearValue(autocompleteCommandModel.all(mode.value));
                return bindMode();
            }

            autocompleteCommandModel.trigger(value, mode);
            resetMode();
            hide();
            clearValue();
            bindMode();
        };

        const onInput = ({ target }) => {
            // Classic autocompletion
            const { list, hasAutocompletion } = autocompleteCommandModel.filter(target.value, mode.value);
            hasAutocompletion && (awesomplete.list = list);
        };

        /**
         * Hide the component if we use the hotkey (hotkey doesn't work with input)
         * or Escape. As we are adding escape we don't want to use the className mousetrap on the input.
         * @param  {Number} options.keyCode
         * @param  {Boolean} options.shiftKey
         * @return {void}
         */
        const onKeyDown = ({ keyCode, shiftKey }) => {
            const isESC = keyCode === ESCAPE_KEY;
            const isHotkey = shiftKey && keyCode === SPACE_KEY;

            if (scope.isVisible && keyCode === BACKSPACE_KEY && isModeLabels()) {
                resetMode();
                clearValue();
                return bindMode();
            }

            if ((isHotkey || isESC) && scope.isVisible) {
                if (!mode.value) {
                    clearValue();
                    return hide();
                }

                resetMode();
                clearValue();
                return bindMode();
            }
        };

        /**
         * Update the model when an user select an option
         */
        awesomplete.replace = action;

        el.on('input', onInput);
        el.on('keydown', onKeyDown);

        scope.$on('$destroy', () => {
            el.off('keydown', onKeyDown);
            el.off('input', onInput);
            autocompleteCommandModel.reset();
        });
    };
    return {
        scope: {
            isVisible: '='
        },
        replace: true,
        templateUrl: require('../../../templates/command/autocompleteCommand.tpl.html'),
        compile: autocompleteBuilder({ link })
    };
}
export default autocompleteCommand;
