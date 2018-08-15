import _ from 'lodash';

/* @ngInject */
function responsiveComposer(AppModel, mailSettingsModel) {
    const latestState = {};

    /**
     * Factory to compute sizes
     * @param  {$scope} scope
     * @return {Function}        Callback
     */
    const computeType = (scope) => () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmall = width <= 640 || height <= 600;

        // If the composer is maximized do nothing, keep this state
        if (scope.message.maximized && !latestState.isSmall) {
            return;
        }

        // If the composer is minimized do nothing, keep this state
        if (scope.message.minimized) {
            return;
        }

        latestState.isSmall = isSmall;

        scope.$applyAsync(() => {
            AppModel.set('small', height < 700 && height >= 600);
            AppModel.set('mini', height < 600);

            isSmall && scope.maximize(scope.message);
            !isSmall && mailSettingsModel.get('ComposerMode') === 0 && scope.normalize(scope.message);
        });
    };

    return {
        restrict: 'A',
        link(scope) {
            const resizable = computeType(scope);
            const onResize = _.debounce(resizable, 100);

            const id = setTimeout(() => {
                resizable();
                clearTimeout(id);
            }, 100);

            window.addEventListener('resize', onResize);

            // Remove listener on resize window
            scope.$on('$destroy', () => {
                window.removeEventListener('resize', onResize);
            });
        }
    };
}
export default responsiveComposer;
