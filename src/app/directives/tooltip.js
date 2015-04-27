angular.module("proton.tooltip", [])

.directive("ptTooltip", function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.attr('title', attrs.ptTooltip);
            $(element[0]).tooltip({
                delay: 300,
                placement: attrs.ptPlacement || 'top',
                html: attrs.ptHtml || false
            });
        }
    };
});
