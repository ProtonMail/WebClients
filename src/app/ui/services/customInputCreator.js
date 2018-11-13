import _ from 'lodash';

import { uniqID, ucFirst } from '../../../helpers/string';

/* @ngInject */
function customInputCreator() {
    /**
     * {@link https://www.w3.org/TR/html5/forms.html#concept-input-apply}
     */

    const DEFAULT_ATTRIBUTES = ['id', 'class', 'value', 'checked', 'name', 'disabled', 'required', 'placeholder'];

    const isDefaultAttribute = (name = '') => DEFAULT_ATTRIBUTES.some((key) => key === name);
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

    const getLabelInputLink = (attributes = []) => {
        const customId = attributes.filter((attr) => attr === 'customId')[0];
        if (customId) {
            return { for: customId, id: customId };
        }
        const id = `customInput${uniqID()}`;
        return { for: id, id };
    };

    const removeWatcher = (node, key) => node.removeAttribute(`data-custom-${key}`);

    const bindAttributes = (node, { el, attr = {}, type = '' }) => {
        const REGEXP_CUSTOM_DIRECTIVE = new RegExp(`custom${ucFirst(type)}`);

        // filter attributes for the input
        const inputAttributes = Object.keys(attr).filter((attribute) => {
            const isCustom = /custom[A-Z]/.test(attribute);
            // You can have custom args / directive with the directive's name as namespace
            const isCustomDirective = REGEXP_CUSTOM_DIRECTIVE.test(attribute);
            return isCustom && !isCustomDirective;
        });

        const link = getLabelInputLink(inputAttributes);

        attr[link.id] && (node.id = attr[link.id]);

        inputAttributes.forEach((attribute) => {
            const key = nameToAttribute(attribute);

            // Do not put default attributes into the dataset

            if (/aria/.test(key) || isDefaultAttribute(key)) {
                // Extend className
                if (key === 'class') {
                    removeWatcher(el[0], key);
                    return node.classList.add(...attr[attribute].split(' '));
                }

                node.setAttribute(key, attr[attribute]);
            } else {
                node.setAttribute(`data-${key}`, attr[attribute]);
            }

            // Remove useless watchers
            removeWatcher(el[0], key);
            delete attr[attribute];
        });

        return inputAttributes;
    };

    /**
         * Custom compile function for a directive custom<Input type>
         *     - checkbox
         *     - radio
         * Bind to the input every custom attribute you want, you need to prefix them by data-custom
         * Ex:
         *     <custom-checkbox data-custom-name="bob" data-custom-ng-change="demo = true">
         *
         * It will attach to the input two attributes:
                - data-ng-click
                - name
         * @param  {String} type type of input
         * @param {Function} link
         * @return {Function} Compile function
         */
    const compiler = (type = '', { pre, post = _.noop, compile = _.noop } = {}) => (el, attr) => {
        const $input = el[0].querySelector(`input[type="${type}"]`);
        bindAttributes($input, { el, attr, type });
        compile(el, attr);
        return pre ? { pre, post } : post;
    };

    return compiler;
}
export default customInputCreator;
