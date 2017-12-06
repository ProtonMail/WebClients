/* @ngInject */
const customRadio = (customInputCreator) => ({
    replace: true,
    templateUrl: 'templates/ui/customRadio.tpl.html',
    compile: customInputCreator('radio')
});
export default customRadio;
