/* @ngInject */
function ptTooltip(tooltipModel) {
    return {
        link(scope, element, attrs) {
            tooltipModel.add(element, {
                title: attrs.ptTooltip,
                placement: attrs.ptPlacement,
                html: attrs.ptHtml
            });
        }
    };
}
export default ptTooltip;
