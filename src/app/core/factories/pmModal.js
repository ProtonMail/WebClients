angular.module('proton.core')
.factory('pmModal', (
    $animate,
    $compile,
    $rootScope,
    $controller,
    $q,
    $http,
    $templateCache
) => {
    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exacly one of either template or templateUrl');
        }

        const controller = config.controller || null;
        const controllerAs = config.controllerAs;
        const container = angular.element(config.container || document.body);
        let element = null;
        let html;
        let scope;

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http.get(config.templateUrl, {
                cache: $templateCache
            }).then(({ data }) => data);
        }

        function activate(locals) {
            return html.then((html) => {
                if (!element) {
                    attach(html, locals);
                }
                $('#body').append('<div class="modal-backdrop fade in"></div>');
                $rootScope.modalOpen = true;
                setTimeout(() => {
                    $('.modal').addClass('in');
                    window.scrollTo(0, 0);
                    Mousetrap.bind('escape', () => deactivate());
                }, 100);
            });
        }

        function attach(html, locals) {
            element = angular.element(html);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes');
            }
            scope = $rootScope.$new();
            if (controller) {
                if (!locals) {
                    /* eslint  { "no-param-reassign": "off"} */
                    locals = {};
                }
                locals.$scope = scope;
                const ctrl = $controller(controller, locals);
                if (controllerAs) {
                    scope[controllerAs] = ctrl;
                }
            } else if (locals) {
                /* eslint  { "guard-for-in": "off", "no-restricted-syntax": "off"} */
                for (const prop in locals) {
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
            return $animate.leave(element).then(() => {
                Mousetrap.unbind('escape');
                scope.$destroy();
                scope = null;
                element.remove();
                element = null;
                $rootScope.modalOpen = false;
                $('.modal-backdrop').remove();
            });
        }

        function active() {
            return !!element;
        }

        return {
            activate,
            deactivate,
            active
        };
    };
});
