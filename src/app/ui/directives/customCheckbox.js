/* @ngInject */
const customCheckbox = (customInputCreator) => ({
    replace: true,
    templateUrl: 'templates/ui/customCheckbox.tpl.html',
    compile: customInputCreator('checkbox')
});
export default customCheckbox;
