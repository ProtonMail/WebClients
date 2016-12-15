angular.module('proton.ui')
    .directive('readUnread', () => ({
        replace: true,
        templateUrl: 'templates/directives/ui/readUnread.tpl.html',
        link(scope, el) {
            const $a = el.find('a');

            // Actions are coming from elementCtrl
            const onClick = (e) => {
                e.preventDefault();
                scope.$applyAsync(() => scope[e.target.getAttribute('data-action')]());
            };
            $a.on('click', onClick);

            scope.$on('$destroy', () => {
                $a.off('click', onClick);
            });
        }
    }));
