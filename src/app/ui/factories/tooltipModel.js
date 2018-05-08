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

    const remove = (element) => element.tooltip('destroy');
    const hide = (element) => element.tooltip('hide');
    const hideAll = () => $('.tooltip').tooltip('hide');

    return { add, update, remove, hide, hideAll };
}
export default tooltipModel;
