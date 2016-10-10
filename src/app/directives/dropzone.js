/**
 *
 * Usage:
 *
 * <div ng-app="app" ng-controller="SomeCtrl">
 *   <button dropzone="dropzoneConfig">
 *     Drag and drop files here or click to upload
 *   </button>
 * </div>
 */

angular.module('proton.dropzone', [])
    .directive('dropzone', () => {
        return {
            scope: {
                dropzoneConfig: '&dropzone'
            },
            restrict: 'A',
            link(scope, element) {

                Dropzone.autoDiscover = false;

                const config = (angular.isFunction(scope.dropzoneConfig)) ? scope.dropzoneConfig() : scope.dropzoneConfig;

                // create a Dropzone for the element with the given options
                const dropzone = new Dropzone(element[0], config.options);

                // bind the given event handlers
                angular.forEach(config.eventHandlers, (handler, event) => {
                    dropzone.on(event, handler);
                });

                // remove the dropzone instance
                scope.$on('$destroy', () => {
                    dropzone.disable();
                });
            }
        };
    });
