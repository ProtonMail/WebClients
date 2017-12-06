/* @ngInject */
const headerBlock = () => ({
    replace: true,
    transclude: true,
    template: '<header class="headerBlock-container" ng-transclude></header>'
});
export default headerBlock;
