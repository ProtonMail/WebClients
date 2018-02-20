import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function messageDisplayError($rootScope) {

    const CLASS_NAME = {
        REPORT: 'messageDisplayError-btn-report'
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/messageDisplayError.tpl.html'),
        link(scope, el) {
            const onClick = (e) => {
                if (e.target.classList.contains(CLASS_NAME.REPORT)) {
                    e.preventDefault();
                    $rootScope.$emit('bugReport', {
                        type: 'new',
                        data: {
                            content: dedentTpl`


                                === Debug stacktrace for the support ===
                                ${scope.message.errorInfo.stack}
                            `
                        }
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
