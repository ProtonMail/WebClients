import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function messageDisplayError(dispatchers) {
    const CLASS_NAME = {
        REPORT: 'messageDisplayError-btn-report'
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageDisplayError.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['bugReport']);
            const onClick = (e) => {
                if (e.target.classList.contains(CLASS_NAME.REPORT)) {
                    e.preventDefault();
                    dispatcher.bugReport('new', {
                        content: dedentTpl`



                            === Debug stacktrace for the support ===
                            ${scope.message.errorInfo.message}
                            ${scope.message.errorInfo.stack}
                        `
                    });
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default messageDisplayError;
