angular.module("proton.modals", [])

.factory('pmModal', ['$animate', '$compile', '$rootScope', '$controller', '$q', '$http', '$templateCache', function($animate, $compile, $rootScope, $controller, $q, $http, $templateCache) {
    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exacly one of either template or templateUrl');
        }

        var template = config.template,
            controller = config.controller || null,
            controllerAs = config.controllerAs,
            container = angular.element(config.container || document.body),
            element = null,
            html,
            scope;

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http.get(config.templateUrl, {
                cache: $templateCache
            }).
            then(function(response) {
                return response.data;
            });
        }

        function activate(locals) {
            return html.then(function(html) {
                if (!element) {
                    attach(html, locals);
                }
            });
        }


        function attach(html, locals) {
            element = angular.element(html);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes')
            }
            scope = $rootScope.$new();
            if (controller) {
                if (!locals) {
                    locals = {};
                }
                locals.$scope = scope;
                var ctrl = $controller(controller, locals);
                if (controllerAs) {
                    scope[controllerAs] = ctrl;
                }
            } else if (locals) {
                for (var prop in locals) {
                    scope[prop] = locals[prop];
                }
            }
            $compile(element)(scope);
            return $animate.enter(element, container);
        }

        function deactivate() {
            if (!element) {
                return $q.when();
            }
            return $animate.leave(element).then(function() {
                scope.$destroy();
                scope = null;
                element.remove();
                element = null;
            });
        }

        function active() {
            return !!element;
        }

        return {
            activate: activate,
            deactivate: deactivate,
            active: active
        };
    };
}])

// confirm modal
.factory('confirmModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.message = params.message;


            this.confirm = function() {
                if(angular.isDefined(params.confirm) && angular.isFunction(params.confirm)) {
                    params.confirm();
                }
            };

            this.cancel = function() {
                if(angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            $timeout(function() {
                this.class = 'in';
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/confirm.tpl.html'
    });
})

// alert modal
.factory('alertModal', function(pmModal) {
    return pmModal({
        controller: function(params, $timeout) {
            this.message = params.message;

            this.ok = function() {
                if(angular.isDefined(params.ok) && angular.isFunction(params.ok)) {
                    params.ok();
                }
            };

            $timeout(function() {
                this.class = 'in';
            }.bind(this), 100);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alert.tpl.html'
    });
});
