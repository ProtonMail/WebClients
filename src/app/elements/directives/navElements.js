angular.module('proton.elements')
    .directive('navElements', ($rootScope, $state, authentication, tools, CONSTANTS) => {

        const CLASS_DISPLAY = 'navElements-displayed';
        const CLASS_ERROR = 'navElements-no-';
        const SPECIAL_BOXES = ['drafts', 'search', 'sent', 'allDrafts', 'allSent'];

        const dispatch = (type, data = {}) => $rootScope.$emit('elements', { type, data });

        const showNextPrev = () => {
            const box = tools.currentMailbox();
            const rowMode = authentication.user.ViewLayout === CONSTANTS.ROW_MODE;
            const context = tools.cacheContext();
            const notSpecial = SPECIAL_BOXES.indexOf(box) === -1;
            return $state.params.id && rowMode && context && notSpecial;
        };

        return {
            replace: true,
            templateUrl: 'templates/elements/navElements.tpl.html',
            link(scope, el) {

                const unsubscribe = [];

                const toggleClass = () => {
                    const action = showNextPrev() ? 'add' : 'remove';
                    el[0].classList[action](CLASS_DISPLAY);
                };

                const toggleClassError = (name, type) => {
                    if (type === 'success') {
                        el[0].classList.remove(CLASS_ERROR + 'previous');
                        el[0].classList.remove(CLASS_ERROR + 'next');
                    }
                    if (type === 'error') {
                        el[0].classList.add(CLASS_ERROR + name);
                    }
                };

                toggleClass();

                unsubscribe.push($rootScope.$on('$stateChangeSuccess', toggleClass));
                unsubscribe.push($rootScope.$on('elements', (e, { type }) => {

                    if (/(previous|next)\.(error|success)$/.test(type)) {
                        const [, name, flag ] = type.split('.');
                        toggleClassError(name, flag);
                    }
                }));

                const onClick = ({ target }) => {
                    dispatch(`switchTo.${target.getAttribute('data-dest')}`, {
                        conversation: scope.conversation
                    });
                };
                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
