import { moveToLast } from '../../../helpers/arrayHelper';

/* @ngInject */
function contactMerger() {
    /**
     * Check whether the contact is included.
     * @param {object} contact
     * @returns {boolean}
     */
    const isIncluded = ({ deleted, selected }) => !deleted && selected;

    /**
     * Prepare array to be merged.
     * Include selected but not deleted items.
     * @param {Array} arr
     */
    const prepareArray = (arr = []) => arr.filter(isIncluded);

    /**
     * Click handlers for the actions.
     */
    const clickHandlers = {
        details(arr, i) {
            return arr[i];
        },
        preview(arr) {
            return arr;
        },
        select(arr, i) {
            const item = arr[i];
            if (item.deleted) {
                return arr;
            }
            item.included = isIncluded(item);
            return moveToLast(arr, i, (item) => item.selected === false || item.deleted === true);
        },
        undelete(arr, i) {
            const item = arr[i];
            // If already deleted, do nothing.
            if (!item.deleted) {
                return arr;
            }
            item.deleted = false;
            item.selected = true;
            item.included = isIncluded(item);
            return moveToLast(arr, i, (item) => item.selected === false || item.deleted === true);
        },
        delete(arr, i) {
            const item = arr[i];
            // If already deleted, do nothing.
            if (item.deleted) {
                return arr;
            }
            item.deleted = true;
            item.selected = false;
            item.included = isIncluded(item);
            return moveToLast(arr, i, (item) => item.deleted === true);
        }
    };

    /**
     * Extract a value from a vCard and a field.
     * @param {vCard} vcard
     * @param {string} field
     * @returns {string}
     */
    const extract = (vcard, field) => {
        const property = vcard.get(field);
        return property && property.valueOf();
    };

    /**
     * Gets a vCard preference if it exists for a given property.
     * @param {vCard property} property
     * @returns {number}
     */
    const getVCardPreference = (property) => {
        const { pref = '0' } = property.getParams() || {};
        return parseInt(pref, 10);
    };

    /**
     * Format a vCard value for display.
     * @param {Property|Array} value
     * @returns {string}
     */
    const formatValueForDisplay = (value) => {
        if (Array.isArray(value)) {
            return value
                .slice()
                .sort((a, b) => getVCardPreference(a) - getVCardPreference(b))
                .map((p) => p.valueOf())
                .join(', ');
        }
        return value;
    };

    /**
     * Format a contact for display.
     * @param ID
     * @param vCard
     * @returns {{id, name: string, email: string, vCard, selected: boolean, deleted: boolean, included: boolean}}
     */
    const formatContact = ({ ID, vCard } = {}) => ({
        id: ID,
        name: formatValueForDisplay(extract(vCard, 'fn')),
        email: formatValueForDisplay(extract(vCard, 'email')),
        vCard,
        selected: true,
        deleted: false,
        included: true
    });

    return {
        restrict: 'E',
        replace: true,
        scope: {
            groups: '=',
            details: '<',
            preview: '<'
        },
        templateUrl: require('../../../templates/contact/contactMerger.tpl.html'),
        link(scope, $element) {
            const element = $element[0];

            // Format the contacts to display for each group.
            scope.groups = Object.keys(scope.groups).reduce(
                (acc, key) => ((acc[key] = scope.groups[key].map(formatContact)), acc),
                {}
            );

            // Drag control listener for the DnD.
            scope.dragControlListener = {
                containment: '.contactMergerList-table',
                containerPositioning: 'relative',
                accept(sourceItemHandleScope, destSortableScope, destItemScope) {
                    // Ensures the item that is being dragged from is valid.
                    if (!isIncluded(sourceItemHandleScope.itemScope.modelValue)) {
                        return false;
                    }
                    // Ensures dragging is in the same group.
                    if (sourceItemHandleScope.itemScope.sortableScope.$id !== destSortableScope.$id) {
                        return false;
                    }
                    // Ensures the item that is being dragged to is valid.
                    return !destItemScope || isIncluded(destItemScope.modelValue);
                }
            };

            /**
             * Check whether this group will be merged or not.
             * @param email
             * @returns {boolean}
             */
            scope.willMerge = (email) => {
                const arr = prepareArray(scope.groups[email]);
                return arr.length >= 2;
            };

            /**
             * Callback when a specific group has been merged.
             * Used by the preview modal.
             * @param {string} groupName
             */
            const onPreviewMerge = (groupName = '') => {
                delete scope.groups[groupName];
                return scope.groups;
            };

            function onClick({ target }) {
                /**
                 * Get the email and index of the item in the list that was clicked from
                 * a parent in which the `data-email` and `data-i` is set. This way it does
                 * not have to be repeated on each button.
                 * @param node
                 * @returns {{email: string, i: number}}
                 */
                const getClickedContact = (node) => {
                    let traverse = node;
                    while (traverse.parentNode) {
                        traverse = traverse.parentNode;
                        if (traverse.dataset.email) {
                            break;
                        }
                    }
                    return {
                        email: traverse.dataset.email,
                        i: parseInt(traverse.dataset.i, 10)
                    };
                };
                const name = target.name;
                switch (name) {
                    case 'details': {
                        const { email, i } = getClickedContact(target);
                        scope.details(clickHandlers.details(scope.groups[email], i));
                        break;
                    }
                    case 'preview': {
                        const { email } = getClickedContact(target);
                        scope.preview(clickHandlers.preview(scope.groups[email]), email, onPreviewMerge);
                        break;
                    }
                    case 'undelete':
                    case 'delete':
                    case 'select': {
                        const { email, i } = getClickedContact(target);
                        scope.$applyAsync(() => {
                            scope.groups[email] = clickHandlers[name](scope.groups[email], i);
                        });
                        break;
                    }
                    default:
                        break;
                }
            }

            element.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                element.removeEventListener('click', onClick);
            });
        }
    };
}

export default contactMerger;
