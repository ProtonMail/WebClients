angular.module('proton.elements')
    .directive('ptSelectAllElements', ($rootScope) => ({
        link(scope, el) {

            $rootScope.numberElementChecked = 0;

            function onChange({ target }) {
                const isChecked = target.checked;

                scope
                    .$applyAsync(() => {

                        _.each(scope.conversations, (conversation) => {
                            conversation.Selected = isChecked;
                        });

                        $rootScope.numberElementChecked = isChecked ? scope.conversations.length : 0;
                        $rootScope.showWelcome = false;
                    });
            }
            el.on('change', onChange);

            scope
            .$on('$destroy', () => {
                el.off('change', onChange);
            });
        }

    }));
