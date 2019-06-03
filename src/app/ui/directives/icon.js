/* @ngInject */
function icon() {
    return {
        restrict: 'E',
        replace: true,
        template: '<svg role="img" focusable="false"></svg>',
        link(scope, el, { viewBox = '0 0 16 16', size = 16, fill = 'grey', name, style }) {
            el[0].innerHTML = `<use xlink:href="#shape-${name}"/>`;
            el[0].classList.add(`icon-${size}p`);

            style && el.prop('style', style);

            if (fill) {
                el[0].classList.add(`fill-global-${fill}`);
            }

            el[0].setAttribute('viewBox', viewBox);
        }
    };
}
export default icon;
