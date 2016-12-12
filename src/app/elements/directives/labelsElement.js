angular.module('proton.elements')
.directive('labelsElement', ($rootScope, $filter, $state) => {
    const toLabels = $filter('labels');
    const HIDE_CLASSNAME = 'labelsElement-hidden';

    const moreVisibility = (node) => ({
        hide() {
            node.classList.add(HIDE_CLASSNAME);
        },
        show() {
            _rAF(() => node.classList.remove(HIDE_CLASSNAME));
        }
    });

    return {
        restrict: 'E',
        templateUrl: 'templates/element/labelsElement.tpl.html',
        replace: true,
        scope: {
            element: '='
        },
        link(scope, el) {

            const moreToggle = moreVisibility(el[0].querySelector('.labelsElement-more'));

            const build = (e, { LabelIDs }) => {
                moreToggle.hide();

        // Check if there is custom labels
                if (Array.isArray(LabelIDs)) {
                    const labels = toLabels(LabelIDs);
                    scope.labels = labels.slice(0, 4);
                    labels.length > 4 && moreToggle.show();
                }
            };

            const onClick = (e) => {
                e.stopPropagation();

                const { target } = e;
                if (target.nodeName === 'LABEL') {
                    const label = target.getAttribute('data-label-id');
                    $state.go('secured.label', { label });
                }
            };

            const unsubscribe = $rootScope.$on('labelsElement.' + scope.element.ID, build);

            build(undefined, scope.element);

            el.on('click', onClick);

            scope
        .$on('$destroy', () => {
            el.off('click', onClick);
            unsubscribe();
        });
        }
    };
});
