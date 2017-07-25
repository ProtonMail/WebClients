angular.module('proton.autoresponder')
    .directive('durationselect', ($rootScope, autoresponderModel, autoresponderLanguage) => {

        const frequencies = [
            { label: autoresponderLanguage.DURATION_FIXED, value: autoresponderModel.constants.FIXED_INTERVAL },
            { label: autoresponderLanguage.DURATION_DAILY, value: autoresponderModel.constants.DAILY },
            { label: autoresponderLanguage.DURATION_WEEKLY, value: autoresponderModel.constants.WEEKLY },
            { label: autoresponderLanguage.DURATION_MONTHLY, value: autoresponderModel.constants.MONTHLY },
            { label: autoresponderLanguage.DURATION_FOREVER, value: autoresponderModel.constants.FOREVER }
        ];

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/durationselect.tpl.html',
            scope: {},
            link(scope, elem, { disableInput, repeat }) {
                const unsubscribe = [];
                // don't directly use model.repeat this, we want to update the model before the scope.model is changed
                // this prevents race conditions where something else is initialized before the autoresponderModel is informed.

                scope.frequencies = frequencies;
                scope.repeat = _.findWhere(scope.frequencies, { value: Number(repeat) });

                if (disableInput === 'true') {
                    elem.attr('disabled', 'disabled');
                }

                function onInput() {
                    scope.$applyAsync(() => {
                        autoresponderModel.set({ repeat: scope.repeat.value });
                    });
                }

                unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        scope.repeat = _.findWhere(scope.frequencies, { value: data.autoresponder.repeat });
                    }
                }));

                elem.on('change', onInput);
                unsubscribe.push(() => elem.off('change', onInput));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });

            }
        };
    });
