/* @ngInject */
const loaderTag = () => ({
    restrict: 'E',
    replace: true,
    scope: {},
    template: '<div class="loader"><em></em></div>'
});
export default loaderTag;
