angular.module('proton.ui')
.directive('ptTooltip', (AppModel) => {
    return {
        link(scope, element, attrs) {
            if (!AppModel.is('mobile')) {
                const title = attrs.ptTooltip;
                element.attr('title', title);
                element.attr('aria-label', title);

                element.tooltip({
                    trigger: 'hover', // The default value for trigger is 'hover focus'
                    container: 'body',
                    placement: attrs.ptPlacement || 'top',
                    html: attrs.ptHtml || false
                });
            }
        }
    };
});
