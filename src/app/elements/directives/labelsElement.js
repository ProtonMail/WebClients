angular.module('proton.elements')
.directive('labelsElement', ($rootScope, labelsModel, authentication, $state) => {

    const HIDE_CLASSNAME = 'labelsElement-hidden';

    const toLabels = (list = []) => {
        return list.reduce((acc, id) => {
            const item = labelsModel.read(id, 'labels');
            item && acc.push(item);
            return acc;
        }, []);
    };

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
        templateUrl: 'templates/elements/labelsElement.tpl.html',
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
                    scope.labels = labels.length ? angular.copy(labels.slice(0, 4)) : [];
                    labels.length > 4 && moreToggle.show();
                }
            };

            const onClick = (e) => {
                e.stopPropagation();

                if (e.target.nodeName === 'LABEL') {
                    const label = e.target.getAttribute('data-label-id');
                    $state.go('secured.label', { label });
                }
            };

            const unsubscribe = $rootScope.$on('labelsElement.' + scope.element.ID, build);

            build(undefined, scope.element);

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
});
