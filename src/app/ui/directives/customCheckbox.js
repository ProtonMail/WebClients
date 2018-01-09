/* @ngInject */
const customCheckbox = (customInputCreator) => ({
    replace: true,
    templateUrl: require('../../../templates/ui/customCheckbox.tpl.html'),
    compile: customInputCreator('checkbox')
});
export default customCheckbox;
