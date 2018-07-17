/* @ngInject */
function phishingBtn(bugReportModel) {
    const REPORTED_CLASS = 'phishingBtn-reported';

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/phishingBtn.tpl.html'),
        link(scope, el) {
            const onClick = async () => {
                await bugReportModel.reportPhishing(scope.message);
                el[0].classList.add(REPORTED_CLASS);
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}

export default phishingBtn;
