/* @ngInject */
function dropdown($document, dispatchers) {
    const CLASS_OPEN = 'pm_dropdown-opened';

    return {
        restrict: 'A',
        scope: {},
        link(scope, element, { dropdownNoAutoClose }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['closeDropdown']);
            const parent = element.parent();
            const dropdown = parent.find('.pm_dropdown');

            function showDropdown() {
                element.addClass('active');
                dropdown.addClass(CLASS_OPEN);
                $document.on('click', outside);
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

                dispatcher.closeDropdown('close');
            }

            function click() {
                const wasOpen = element.hasClass('active');
                // Close all dropdowns
                dispatcher.closeDropdown('close');

                if (!wasOpen) {
                    // Open only this one
                    showDropdown();
                }

                return false;
            }

            // Listeners
            element.on('click', click);

            on('closeDropdown', hideDropdown);

            scope.$on('$destroy', () => {
                element.off('click', click);
                hideDropdown();
                unsubscribe();
            });
        }
    };
}
export default dropdown;
