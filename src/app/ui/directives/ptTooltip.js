import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function ptTooltip(dispatchers) {
    return {
        restrict: 'A',
        link(scope, element, { ptTooltip = '', ptPlacement = 'top', ptHtml = false }) {
            const { on, unsubscribe } = dispatchers();
            const tooltip = tooltipModel(element, {
                title: ptTooltip,
                placement: ptPlacement,
                html: ptHtml
            });

            on('tooltip', (e, { type }) => {
                type === 'hideAll' && tooltip.hide();
            });

            scope.$on('$destroy', () => {
                tooltip.dispose();
                unsubscribe();
            });
        }
    };
}
export default ptTooltip;
