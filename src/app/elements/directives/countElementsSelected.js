/* @ngInject */
function countElementsSelected(dispatchers) {
    return {
        replace: true,
        templateUrl: require('../../../templates/elements/countElementsSelected.tpl.html'),
        link(scope, element) {
            const { dispatcher } = dispatchers(['selectElements']);
            const $btn = element.find('.countElementsSelected-btn-unselect');
            const onClick = () => dispatcher.selectElements('all', { isChecked: false });

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default countElementsSelected;
