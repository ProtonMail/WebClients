/* @ngInject */
function ptTooltip(AppModel, tooltipModel) {
    return {
        link(scope, element, attrs) {
            if (!AppModel.is('mobile')) {
                tooltipModel.add(element, {
                    title: attrs.ptTooltip,
                    placement: attrs.ptPlacement,
                    html: attrs.ptHtml
                });
            }
        }
    };
}
export default ptTooltip;
