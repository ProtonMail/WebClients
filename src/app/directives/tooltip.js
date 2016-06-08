angular.module("proton.tooltip", [])

.directive("ptTooltip", function() {
    return {
        restrict: 'A',
        scope: {
            ptTooltip: '@'
        },
        link: function(scope, element, attrs) {
            var title = scope.ptTooltip;

            if(angular.isFunction(scope.ptTooltip)) {
                title = scope.ptTooltip();
            }

            element.attr('title', title);
            element.attr('aria-label', title);

            $(element[0]).tooltip({
                trigger : 'hover', // The default value for trigger is 'hover focus'
                container: 'body',
                placement: attrs.ptPlacement || 'top',
                html: attrs.ptHtml || false
            });
        }
    };
});
