import { MIME_TYPES } from '../../constants';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function printMessage(printMessageModel, sanitize) {
    const isPlain = ({ MIMEType } = {}) => MIMEType === PLAINTEXT;
    return {
        scope: {
            config: '=printMessageConfig'
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/utils/printMessage.tpl.html'),
        link(scope, el) {
            const $content = el.find('.printMessage-content');

            scope.model = printMessageModel(scope.config);

            $content[0].innerHTML = sanitize.message(scope.config.content); // Can't use ng-bind-html because it removes style
            isPlain(scope.model) && $content.addClass('printMessage-plain-content');
        }
    };
}
export default printMessage;
