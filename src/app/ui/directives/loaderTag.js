/* @ngInject */
const loaderTag = () => ({
    restrict: 'E',
    replace: true,
    template: '<div class="loader" aria-busy="true"></div>'
});
export default loaderTag;
