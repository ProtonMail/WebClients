import { ESCAPE_KEY, ESCAPE_KEY_OLD, RETURN_KEY, SPACE_KEY, SPACE_KEY_OLD } from '../../keyboard-event-constants';
/* @ngInject */
function dropdown($document, dispatchers) {
    const CLASS_OPEN = 'pm_dropdown-opened';
    const ATTR_EXPANDED = 'aria-expanded';

    return {
        restrict: 'A',
        scope: {},
        link(scope, element, { dropdownNoAutoClose, dropdownType }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['dropdown']);

            const parent = element.parent();
            const dropdown = parent.find('.pm_dropdown');

            function showDropdown() {
                element.addClass('active');
                element.attr(ATTR_EXPANDED, 'true');
                dropdown.addClass(CLASS_OPEN);
                $document.on('click', outside);
                dispatcher.dropdown('show', { type: dropdownType });
            }

            function hideDropdown() {
                element.removeClass('active');
                element.attr(ATTR_EXPANDED, 'false');
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

            const onKeyDown = ({ key }) => {
                if (key === SPACE_KEY || key === SPACE_KEY_OLD || key === RETURN_KEY) {
                   click();
                   return false;
                }
                if (key === ESCAPE_KEY || key === ESCAPE_KEY_OLD) {
                    hideDropdown();
                    return false;
                }
            };

            element.on('click', click);

            element.on('keydown', onKeyDown);

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
