/* @ngInject */
function dropdown($document, dispatchers) {
    const CLASS_OPEN = 'pm_dropdown-opened';

    return {
        restrict: 'A',
        scope: {},
        link(scope, element, { dropdownNoAutoClose, dropdownType }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['dropdown']);

            const parent = element.parent();
            const dropdown = parent.find('.pm_dropdown');

            function showDropdown() {
                element.addClass('active');
                dropdown.addClass(CLASS_OPEN);
                $document.on('click', outside);
                dispatcher.dropdown('show', { type: dropdownType });
            }

            function hideDropdown() {
                element.removeClass('active');
                dropdown.removeClass(CLASS_OPEN);
                $document.off('click', outside);
            }

            function outside() {
                if (dropdownNoAutoClose) {
                    return;
                }
                dispatcher.dropdown('close', { type: dropdownType });
            }

            function click() {
                const wasOpen = element.hasClass('active');
                // Close all dropdowns
                dispatcher.dropdown('close', { type: dropdownType });

                if (!wasOpen) {
                    // Open only this one
                    showDropdown();
                }
                return false;
            }

            element.on('click', click);
            on('dropdown', (e, { type }) => {
                type === 'close' && hideDropdown();
            });

            scope.$on('$destroy', () => {
                element.off('click', click);
                hideDropdown();
                unsubscribe();
            });
        }
    };
}
export default dropdown;
