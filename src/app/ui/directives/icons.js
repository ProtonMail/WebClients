import svg from 'design-system/_includes/sprite-icons.svg';

/* @ngInject */
function icons() {
    return {
        restrict: 'E',
        replace: true,
        template: '<div style="display: none"></div>',
        link(scope, el) {
            el[0].innerHTML = svg;
        }
    };
}
export default icons;
