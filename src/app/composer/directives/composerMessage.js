/* @ngInject */
const composerMessage = () => ({
    replace: true,
    scope: {},
    templateUrl: require('../../../templates/partials/composer.tpl.html'),
    controller: 'ComposeMessageController'
});
export default composerMessage;
