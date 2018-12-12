import _ from 'lodash';

import { MODAL_Z_INDEX } from '../../constants';

/* @ngInject */
function pmModal(
    $animate,
    $compile,
    $rootScope,
    dispatchers,
    $injector,
    $controller,
    $q,
    $http,
    AppModel,
    mailSettingsModel,
    $templateCache
) {
    const $body = $('#body');
    // The highest z-Index for the last modals used. Used to ensure that modals are sort by time (latest modal on top)
    let zIndex = MODAL_Z_INDEX;

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
        const { dispatcher, on, unsubscribe } = dispatchers(['tooltip']);
        const closeAllTooltips = () => dispatcher.tooltip('hideAll');

        if (config.template) {
            html = $q.when(config.template);
        } else {
            html = $http
                .get(config.templateUrl, {
                    cache: $templateCache
                })
                .then(({ data }) => data);
        }

        const show = () => element && element.removeClass('pm_modal-hidden');
        const hide = () => element && element.addClass('pm_modal-hidden');

        function activate(locals) {
            closeAllTooltips();
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
                        const { onEscape = deactivate } = (locals || {}).params || {};
                        onEscape();
                    });
                    clearTimeout(id);
                }, 100);

                on('logout', () => {
                    deactivate();
                });

                on('$stateChangeSuccess', () => {
                    deactivate();
                });
            });
        }

        function attach(html, locals) {
            element = angular.element(html);
            element.css('z-index', zIndex++);
            if (element.length === 0) {
                throw new Error('The template contains no elements; you need to wrap text nodes');
            }
            scope = $rootScope.$new(true);

            /**
             * Default params will auto bind close/cancel API + a way to toggle the visibility of the modal
             * @param  {Object} params
             */
            const getParams = (params = {}) => ({
                close: () => deactivate('close'),
                cancel: () => deactivate('close'), // it's an alias
                show,
                hide,
                ...params
            });

            if (controller) {
                if (!locals) {
                    /* eslint  { "no-param-reassign": "off"} */
                    locals = { params: {} };
                }
                locals.$scope = scope;
                locals.params = getParams(locals.params);

                const ctrl = $controller(controller, locals);
                !ctrl.cancel && (ctrl.cancel = locals.params.cancel);
                !ctrl.close && (ctrl.close = locals.params.close);
                ctrl.$hookClose = (mode) => {
                    // show the previousModal if we have one
                    if (locals.params.previousModal) {
                        const id = setTimeout(() => {
                            locals.params.previousModal.show();
                            clearTimeout(id);
                        }, 300);
                    }
                    (locals.params.hookClose || _.noop)(mode);
                };

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

        function deactivate(mode) {
            if (!element) {
                return $q.when();
            }
            zIndex--;

            unsubscribe();

            return $animate.leave(element).then(() => {
                closeAllTooltips();

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
                scope[controllerAs].$hookClose(mode);
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
            show,
            hide,
            active
        };
    };
}
export default pmModal;
