angular.module('proton.conversation')
.factory('mailboxIdentifersTemplate', (CONSTANTS) => {

    const contains = (key, labels) => _.contains(labels, CONSTANTS.MAILBOX_IDENTIFIERS[key]);
    const templateTag = (className, tooltip) => `<i class="${className}" translate>${tooltip}</i>`;

  /**
   * Compile a template with its className and the tooltip to display
   * @param  {String} options.className
   * @param  {String} options.tooltip
   * @param  {Function} templateMaker          Custom funciton to build a template function(className, tooltip)
   * @return {String}                   template
   */
    const icon = ({ className, tooltip }, templateMaker) => {
        if (templateMaker) {
            return templateMaker(className, tooltip);
        }
        return `<i class="fa ${className}" pt-tooltip="${tooltip}"></i>`;
    };

  /**
   * Returm a factory to expose a context
   * @param  {Object} options.MAP_LABELS map {<label> : {tootlip: <string:translated>, className: <string> }}
   * @param  {Object} options.MAP_TAGS   {<tag> : {tootlip: <string:translated>, className: <string> }}
   * @return {Object}                    {getTemplateLabels, getTemplateTags}
   */
    return ({ MAP_LABELS, MAP_TYPES }) => {

    /**
     * Take a list of labels and check if they exist inside MAILBOX_IDENTIFIERS
     * Then create a template for the icon matching this label based on MAP_LABELS
     * @param  {Array} labels
     * @return {String}       Template
     */
        const getTemplateLabels = (labels) => {
            return Object
                .keys(MAP_LABELS)
                .reduce((acc, key) => {
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
});
