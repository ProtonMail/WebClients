/* @ngInject */
function countElementsSelected($rootScope) {
    return {
        replace: true,
        templateUrl: require('../../../templates/elements/countElementsSelected.tpl.html'),
        link(scope, element) {
            const $btn = element.find('.countElementsSelected-btn-unselect');
            const onClick = () => $rootScope.$emit('selectElements', { type: 'all', data: { isChecked: false } });

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default countElementsSelected;
