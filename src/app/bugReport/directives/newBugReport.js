/* @ngInject */
const newBugReport = (dispatchers) => ({
    replace: true,
    templateUrl: require('../../../templates/bugReport/newBugReport.tpl.html'),
    link(scope, el) {
        const { dispatcher } = dispatchers(['bugReport']);
        const onClick = () => {
            dispatcher.bugReport('new');
        };
        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default newBugReport;
