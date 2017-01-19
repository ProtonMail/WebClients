angular.module('proton.ui')
    .factory('customInputCreator', () => {

        /**
         * {@link https://www.w3.org/TR/html5/forms.html#concept-input-apply}
         */
        const DEFAULT_ATTRIBUTES = {
            checkable: ['id', 'class', 'value', 'checked', 'name', 'disabled', 'required']
        };

        const isDefaultAttribute = (key, name = '') => DEFAULT_ATTRIBUTES[key].some((key) => key === name);

        /**
         * Convert a name from the dataSet to a valid HTML attribute
         * ex:
         *     input: customNgClick
         *     output: data-ng-click
         * @param  {String} input
         * @return {String}
         */
        const nameToAttribute = (input = '') => {
            const attribute = input.replace(/^custom/, '');
            return (attribute.charAt(0) + attribute.slice(1).replace(/([A-Z])/g, '-$1')).toLowerCase();
        };

        /**
         * Custom compile function for a directive custom<Input type>
         *     - checkbox
         *     - radio
         * Bind to the input every custom attribute you want, you need to prefix them by data-custom
         * Ex:
         *     <custom-checkbox data-custom-name="bob" data-custom-ng-click="demo = true">
         *
         * It will attach to the input two attributes:
                - data-ng-click
                - name
         * @param  {String} type type of input
         * @return {Function} Compile function
         */
        const checkableCompiler = (type = '') => (el, attr) => {

            const $input = el[0].querySelector(`input[type="${type}"]`);

            // filter attributes for the input
            const inputAttributes = Object.keys(attr).filter((attribute) => /custom[A-Z]/.test(attribute));

            inputAttributes.forEach((attribute) => {
                const key = nameToAttribute(attribute);

                // Do not put default attributes into the dataset
                if (/aria/.test(key) || isDefaultAttribute('checkable', key)) {

                    // Extend className
                    if (key === 'class') {
                        return $input.classList.add(...attr[attribute].split(' '));
                    }

                    $input.setAttribute(key, attr[attribute]);
                } else {
                    $input.setAttribute(`data-${key}`, attr[attribute]);
                }

                // Remove useless watchers
                el[0].removeAttribute(`data-custom-${key}`);
                delete attr[attribute];
            });
        };

        return { checkableCompiler };
    });
