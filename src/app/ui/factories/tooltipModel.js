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
    const enable = (element) => element.tooltip('enable');
    const disable = (element) => {
        element.tooltip('hide');
        element.tooltip('disable');
    };

    return { add, update, remove, hide, hideAll, enable, disable };
}
export default tooltipModel;
