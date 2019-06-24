/* @ngInject */
const readUnread = () => ({
    replace: true,
    templateUrl: require('../../../templates/directives/ui/readUnread.tpl.html'),
    link(scope, el) {
        const $a = el.find('a');

        // Actions are coming from elementCtrl
        const onClick = (e) => {
            e.preventDefault();
            scope.$applyAsync(() => scope[e.currentTarget.getAttribute('data-action')]());
        };
        $a.on('click', onClick);

        scope.$on('$destroy', () => {
            $a.off('click', onClick);
        });
    }
});
export default readUnread;
