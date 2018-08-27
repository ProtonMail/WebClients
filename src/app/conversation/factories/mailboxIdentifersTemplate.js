import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function mailboxIdentifersTemplate(labelsModel) {
    const CLEANER = document.createElement('div');
    const contains = (key, labels) => _.includes(labels, MAILBOX_IDENTIFIERS[key]);

    /**
     * Remove HTML inside a string, prevent XSS
     * @param  {String} s
     * @return {String}
     */
    const stripHTML = (s) => {
        CLEANER.innerText = s || '';
        return CLEANER.innerHTML;
    };

    const templateTag = (className, tooltip) => `<i class="${className}" translate>${tooltip}</i>`;
    const templateLabel = (className = '', tooltip = '', color = '') => {
        const ptTooltip = stripHTML(tooltip).replace(/"|'/g, '');
        if (color) {
            return `<i class="fa ${className}" pt-tooltip="${ptTooltip}" style="color: ${color}"></i>`;
        }
        return `<i class="fa ${className}" pt-tooltip="${ptTooltip}"></i>`;
    };

    const getFolder = (labelIDs = []) => {
        const id = _.find(labelIDs, (id) => labelsModel.contains(id, 'folders'));
        return labelsModel.read(id, 'folders') || {};
    };

    /**
     * Compile a template with its className and the tooltip to display
     * @param  {String} options.className
     * @param  {String} options.tooltip
     * @param  {Function} templateMaker          Custom funciton to build a template      function(className, tooltip)
     * @return {String}                   template
     */
    const icon = ({ className = '', tooltip = '', color = '' }, templateMaker) => {
        if (className && tooltip) {
            if (templateMaker) {
                return templateMaker(className, tooltip, color);
            }
            return templateLabel(className, tooltip, color);
        }
        return '';
    };

    /**
     * Escape the tooltip because as pt-tooltip is a directive Angular
     * will parse the attribute. We cannot limit this via Angular itself
     * Let's add an empty space `u8203` between {{
     * Angular won't parse it and it doesn't break the label's Name
     *
     * ==> Don't worry there is an empty space, but you cannot see it
     * (⌐■_■)
     * @param  {String} input
     * @return {String}
     */
    const escapeTooltip = (input = '') => input.replace(/^{{/g, '{\u200B{');

    /**
     * Returm a factory to expose a context
     * @param  {Object} options.MAP_LABELS map {<label> : {tootlip: < string:translated>, className: <string> }}
     * @param  {Object} options.MAP_TAGS   {<tag> : {tootlip: <string:translated>,  className: <string> }}
     * @return {Object}                    {getTemplateLabels, getTemplateTags}
     */
    return ({ MAP_LABELS, MAP_TYPES }) => {
        /**
         * Take a list of labels and check if they exist inside MAILBOX_IDENTIFIERS
         * Then create a template for the icon matching this label based on  MAP_LABELS
         * @param  {Array} labels
         * @return {String}       Template
         */
        const getTemplateLabels = (labels) => {
            return Object.keys(MAP_LABELS).reduce((acc, key) => {
                if (key === 'folder') {
                    const { Color: color, Name: tooltip } = getFolder(labels);
                    return (
                        acc +
                        icon(
                            _.extend({}, MAP_LABELS[key], {
                                tooltip: escapeTooltip(tooltip),
                                color
                            })
                        )
                    );
                }
                if (contains(key, labels)) {
                    return acc + icon(MAP_LABELS[key]);
                }
                return acc;
            }, '');
        };

        /**
         * Take the type of message and build the template matching the number
         * @param  {Number} type
         * @return {String}       Template
         */
        const getTemplateType = (type) => {
            if (type === 2 || type === 3) {
                return icon(MAP_TYPES.sent, templateTag);
            }
            if (type === 1) {
                return icon(MAP_TYPES.drafts, templateTag);
            }
            return '';
        };

        return { getTemplateLabels, getTemplateType };
    };
}
export default mailboxIdentifersTemplate;
