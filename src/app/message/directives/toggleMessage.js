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
                    !event.target.classList.contains('messageAddressActionMenu-btn-compose-to') &&
                    !event.target.classList.contains('messageAddressActionMenu-btn-add-contact') &&
                    !event.target.classList.contains('messageAddressActionMenu-btn-copy-address') &&
                    !event.target.classList.contains('messageAddressActionMenu-btn-show-contact') &&
                    !event.target.classList.contains('messageAddressActionMenu-btn-pin-public')
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

            element.on('click', mouseup);

            scope.$on('$destroy', () => {
                element.off('click', mouseup);
            });
        }
    };
}

export default toggleMessage;
