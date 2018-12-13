import { isDraft } from '../../../helpers/message';

/* @ngInject */
function toggleMessage(dispatchers) {
    function selection() {
        if (window.getSelection) {
            return window.getSelection().toString().length === 0;
        }
        return true;
    }

    return {
        restrict: 'A',
        link(scope, element) {
            const { dispatcher } = dispatchers(['composer.load', 'message.open']);

            function mouseup(event) {
                if (
                    selection() &&
                    event.target.nodeName !== 'A' &&
                    !event.target.classList.contains('labelsElement-btn-remove') &&
                    !event.target.classList.contains('messageAddressActionMenu-btn-copy-address')
                ) {
                    scope.$applyAsync(() => {
                        // Open the message in composer if it's a draft
                        if (isDraft(scope.message)) {
                            return dispatcher['composer.load']('', scope.message);
                        }

                        scope.message.expand = !scope.message.expand;
                        // Force close toggle details
                        scope.message.toggleDetails && (scope.message.toggleDetails = false);
                        dispatcher['message.open']('toggle', {
                            message: scope.message,
                            expand: scope.message.expand
                        });
                    });
                }
            }

            element.on('mouseup', mouseup);
            element.on('touchend', mouseup);

            scope.$on('$destroy', () => {
                element.off('mouseup', mouseup);
                element.off('touchend', mouseup);
            });
        }
    };
}

export default toggleMessage;
