/* @ngInject */
function sidebarContact($rootScope, backState, contactCache, contactMerger, gettextCatalog) {
    const SHOW_DELETE_CONTACTS = 'sidebarContact-show-delete-contacts';
    const SHOW_MERGE_BUTTON = 'sidebarContact-show-merge-button';
    const MERGE_TEXT = 'sidebarContact-merge-text';
    const I18N = {
        merge: gettextCatalog.getString('Merge', null, 'Merge contacts')
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/sidebar/sidebarContact.tpl.html'),
        link(scope, element) {
            const $mergeText = element.find(`.${MERGE_TEXT}`);
            const unsubscribe = $rootScope.$on('contacts', (event, { type = '' }) => {
                type === 'contactsUpdated' && scope.$applyAsync(() => update());
            });

            function update() {
                const contacts = contactCache.get();

                if (contacts.length) {
                    element.addClass(SHOW_DELETE_CONTACTS);
                } else {
                    element.removeClass(SHOW_DELETE_CONTACTS);
                }
                const emails = contactMerger.extractDuplicates(contacts);
                const duplicates = Object.keys(emails)
                    .reduce((acc, key) => acc + emails[key].length, 0);

                if (duplicates > 0) {
                    element.addClass(SHOW_MERGE_BUTTON);
                    $mergeText.text(`${I18N.merge} (${duplicates})`);
                } else {
                    element.removeClass(SHOW_MERGE_BUTTON);
                }
            }

            function onClick(event) {
                const action = event.target.getAttribute('data-action');

                switch (action) {
                    case 'back':
                        backState.back();
                        break;
                    case 'deleteContacts':
                        $rootScope.$emit('contacts', { type: action, data: { contactIDs: 'all' } });
                        break;
                    case 'mergeContacts':
                    case 'exportContacts':
                    case 'importContacts':
                        $rootScope.$emit('contacts', { type: action });
                        break;
                    default:
                        break;
                }
            }

            element.on('click', onClick);
            update();

            scope.$on('$destroy', () => {
                unsubscribe();
                element.off('click', onClick);
            });
        }
    };
}
export default sidebarContact;
