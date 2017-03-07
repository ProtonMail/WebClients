angular.module('proton.elements')
    .directive('navElements', ($rootScope, $state, authentication, tools, CONSTANTS) => {

        const CLASS_DISPLAY = 'navElements-displayed';
        const SPECIAL_BOXES = ['drafts', 'search', 'sent'];

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

                const toggleClass = () => {
                    const action = showNextPrev() ? 'add' : 'remove';
                    el[0].classList[action](CLASS_DISPLAY);
                };

                toggleClass();

                const unsubscribe = $rootScope.$on('$stateChangeSuccess', toggleClass);

                const onClick = ({ target }) => {
                    dispatch(`switchTo.${target.getAttribute('data-dest')}`, {
                        conversation: scope.conversation
                    });
                };
                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                    unsubscribe();
                });
            }
        };
    });
