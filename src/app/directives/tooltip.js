angular.module("proton.tooltip", [])

.directive("ptTooltip", function() {
    return {
        link: function(scope, element, attrs) {
            var title = attrs.ptTooltip;
            element.attr('title', title);
            element.attr('aria-label', title);

            element.tooltip({
                trigger : 'hover', // The default value for trigger is 'hover focus'
                container: 'body',
                placement: attrs.ptPlacement || 'top',
                html: attrs.ptHtml || false
            });
        }
    };
});
