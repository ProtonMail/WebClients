/* @ngInject */
function pmModal($animate, $compile, $rootScope, dispatchers, $injector, $controller, $q, $http, AppModel, mailSettingsModel, $templateCache) {
    const $body = $('#body');

    function manageHotkeys(bind = true) {
        if (mailSettingsModel.get('Hotkeys')) {
            const hotkeys = $injector.get('hotkeys');
            hotkeys[bind ? 'bind' : 'unbind']();
        }
    }

    return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
            throw new Error('Expected modal to have exactly one of either template or templateUrl');
        }

        const controller = config.controller || null;
        const controllerAs = config.controllerAs;
        const container = angular.element(config.container || document.body);
        let element = null;
        let html;
        let scope;
        const { on, unsubscribe } = dispatchers();
        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http
                .get(config.templateUrl, {
                    cache: $templateCache
                })
                .then(({ data }) => data);
        }

        function activate(locals) {
            return html.then((html) => {
                if (!element) {
                    attach(html, locals);
                }

                $body.append('<div class="modal-backdrop fade in"></div>');
                AppModel.set('modalOpen', true);
                const id = setTimeout(() => {
                    $('.modal').addClass('in');
                    window.scrollTo(0, 0);
                    manageHotkeys(false); // Disable hotkeys
                    Mousetrap.bind('escape', () => {
                        const { onEscape = deactivate } = locals.params || {};
                        onEscape();
                    });
                    clearTimeout(id);
                }, 100);

                on('logout', () => {
                    deactivate();
                });
            });
        }

        function attach(html, locals) {
            element = angular.element(html);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes');
            }
            scope = $rootScope.$new(true);
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

            unsubscribe();

            return $animate.leave(element).then(() => {
                // We can have a concurrency issues ex: generateModal
                if (!element) {
                    return;
                }
                Mousetrap.unbind('escape');
                manageHotkeys(); // Enable hotkeys
                scope && scope.$destroy();
                /**
                 * Fuck you Enkular
                 * > Called on a controller when its containing scope is destroyed.
                 * https://docs.angularjs.org/api/ng/service/$compile#life-cycle-hooks
                 * Et mon cul c'est du poulet alors ? (╯ὸ︹ό）╯︵ ┻━┻
                 *
                 * So we need to do it for you...
                 * cf https://github.com/angular/angular.js/issues/14376#issuecomment-205926098
                 */
                (scope[controllerAs].$onDestroy || angular.noop)();
                scope = null;
                element.remove();
                element = null;
                AppModel.set('modalOpen', false);
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
}
export default pmModal;
