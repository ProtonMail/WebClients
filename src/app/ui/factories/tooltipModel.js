/* @ngInject */
function tooltipModel() {
    function add(element, { placement = 'top', html = false, title = '' }) {
        element.attr('title', title);
        element.attr('aria-label', title);
        element.tooltip({
            trigger: 'hover', // The default value for trigger is 'hover focus'
            container: 'body',
            placement,
            html
        });
    }

    function update(element, { title }) {
        if (title) {
            element.attr('title', title);
            element.attr('aria-label', title);
            element.attr('data-original-title', title);
        }
    }

    return { add, update };
}
export default tooltipModel;
