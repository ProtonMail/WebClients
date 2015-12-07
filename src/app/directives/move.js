angular.module("proton.move", [])

.directive('dropdownMove', function(authentication, $translate, CONSTANTS) {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/move.tpl.html',
        replace: true,
        link: function(scope, element, attrs) {
            scope.filter = '';
            scope.locs = [];
            scope.labels = [];

            // Add classic locations
            scope.locs.push({ID: '0', name: $translate.instant('INBOX')});
            scope.locs.push({ID: '6', name: $translate.instant('ARCHIVE')});
            scope.locs.push({ID: '4', name: $translate.instant('SPAM')});
            scope.locs.push({ID: '3', name: $translate.instant('TRASH')});

            // Add labels
            _.each(authentication.user.Labels, function(label) {
                scope.labels.push({ID: label.ID, name: label.Name});
            });

            /**
             * Move conversation to a specific location
             * @param {Object} loc
             */
            scope.move = function(loc) {
                console.log(loc.ID);
            };

            /**
             * Apply label and archive
             * @param {Object} label
             */
            scope.applyAndArchive = function(label) {
                console.log(label.ID);
            };
        }
    };
});
