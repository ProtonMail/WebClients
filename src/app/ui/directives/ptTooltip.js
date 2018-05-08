/* @ngInject */
function ptTooltip(tooltipModel) {
    return {
        restrict: 'A',
        link(scope, element, attrs) {
            const onDestroy = () => tooltipModel.remove(element);

            tooltipModel.add(element, {
                title: attrs.ptTooltip,
                placement: attrs.ptPlacement,
                html: attrs.ptHtml
            });

            // Listen on the element instead of the scope: otherwise the element (element.data()) already has been detached from the DOM
            element.on('$destroy', onDestroy);

            scope.$on('$destroy', () => {
                element.off('$destroy', onDestroy);
            });
        }
    };
}
export default ptTooltip;
