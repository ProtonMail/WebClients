import _ from 'lodash';

/* @ngInject */
function durationselect(autoresponderModel, autoresponderLanguage, dispatchers) {
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
        templateUrl: require('../../../templates/autoresponder/durationselect.tpl.html'),
        scope: {},
        link(scope, elem, { disableInput, repeat }) {
            const { on, unsubscribe } = dispatchers();
            // don't directly use model.repeat this, we want to update the model before the scope.model is changed
            // this prevents race conditions where something else is initialized before the autoresponderModel is informed.

            scope.frequencies = frequencies;
            scope.repeat = _.find(scope.frequencies, { value: Number(repeat) });

            if (disableInput === 'true') {
                elem.attr('disabled', 'disabled');
            }

            function onInput() {
                scope.$applyAsync(() => {
                    autoresponderModel.set({ Repeat: scope.repeat.value });
                });
            }

            on('autoresponder', (event, { type, data = {} }) => {
                if (type === 'update') {
                    scope.repeat = _.find(scope.frequencies, { value: data.autoresponder.Repeat });
                }
            });

            elem.on('change', onInput);

            scope.$on('$destroy', () => {
                elem.off('change', onInput);
                unsubscribe();
            });
        }
    };
}
export default durationselect;
