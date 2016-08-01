angular.module('proton.ui')
    .directive('autocompleteEmails', (autocompleteEmailsModel) => ({
        scope: {
            emails: '='
        },
        replace: true,
        templateUrl: 'templates/directives/ui/autocomplete.tpl.html',
        compile(element, {name, placeholder = ''}) {

            // Bind self configuration for this input (uniq)
            const $input = element[0].querySelector('input');
            $input.name = $input.id = name;
            $input.placeholder = placeholder;

            return (scope, el, attr) => {
                const input = angular.element(el[0].querySelector('input'));

                /**
                 * @link {https://leaverou.github.io/awesomplete/#basic-usage}
                 */
                const awesomplete = new Awesomplete(input[0]);

                /**
                 * Update the model when we select a category and bind
                 * not the value into the input but the label (User friendly FTW)
                 */
                awesomplete.replace = function (opt, input) {
                    this.input.value = opt.label;
                };

                const onInput = ({target}) => {
                    debugger;
                    awesomplete.list = autocompleteEmailsModel
                        .map(target.value);
                    debugger;
                };

                input.on('input', onInput);
                scope
                    .$on('$digest', () => {
                        input.off('input', onInput);
                    });
            };
        }
    }));
