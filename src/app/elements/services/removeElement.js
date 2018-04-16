/* @ngInject */
function removeElement(gettextCatalog, AppModel, actionConversation, messageActions, confirmModal, $state, $rootScope, notification, tools) {
    const I18N = {
        TITLE: gettextCatalog.getString('Delete', null, 'Title'),
        MESSAGE: gettextCatalog.getString('Are you sure? This cannot be undone.', null, 'Info'),
        DRAFT_INFO: gettextCatalog.getString(
            'A draft selected is open in a composer, this action will close the composer and delete the message.',
            null,
            'Info'
        ),
        TYPES: {
            message: (n) => gettextCatalog.getPlural(n, 'message', 'messages', {}, 'Type element'),
            conversation: (n) => gettextCatalog.getPlural(n, 'conversation', 'conversations', {}, 'Type element')
        },
        success(total, item) {
            return gettextCatalog.getString('{{total}} {{item}} removed', { total, item }, 'Remove element');
        }
    };

    function redirectUser() {
        // The default view for all conversations in not the state conversation but inbox
        const route = $state.$current.name.replace('.element', '');
        // Return to the state and close message
        $state.go(route, { id: '' });
    }

    /**
     * If we try to delete elements we check if there are some drafts already
     * opened. If so, we change the message we will display inside the confirm
     * modal and we return the list of drafts opened in composer.
     * @param  {Function} getElementsSelected
     * @param  {Array} ids                      Array of ids
     * @return {Object}                        { drafts:Array, isDraftOpen:Boolean, message:String }
     */
    const lookForOpenDraft = (ids = [], getElementsSelected) => {
        // We can try to delete a draft by its conversation id.
        const mapComposer = (AppModel.get('composerList') || []).reduce((acc, item) => {
            acc[item.ID] = 'ID';
            acc[item.ConversationID] = 'ConversationID';
            return acc;
        }, {});

        const listOpenedDraft = ids.reduce((acc, id) => {
            mapComposer[id] && acc.push({ id, key: mapComposer[id] });
            return acc;
        }, []);

        // Check if there is one opened composer in the selection
        if (($state.includes('secured.drafts.**') || $state.includes('secured.allDrafts.**')) && listOpenedDraft.length) {
            const selectedMap = getElementsSelected().reduce(
                (acc, msg) => {
                    acc.ConversationID[msg.ConversationID] = msg;
                    acc.ID[msg.ID] = msg;
                    return acc;
                },
                { ConversationID: {}, ID: {} }
            );

            return {
                isDraftOpen: true,
                drafts: listOpenedDraft.map(({ id, key }) => selectedMap[key][id]),
                message: `${I18N.MESSAGE} <br><p><i>${I18N.DRAFT_INFO}</i></p>`
            };
        }

        return { message: I18N.MESSAGE };
    };

    const removeList = async (ids, context, labelID) => {
        if (context === 'conversation') {
            return actionConversation.remove(ids, labelID);
        }
        return messageActions.destroy(ids);
    };

    /**
     * Delete elements selected
     */
    const remove = ({ getElementsSelected, idsSelected, getTypeSelected } = {}) => {
        const ids = idsSelected();
        const context = getTypeSelected();
        const { message, isDraftOpen, drafts = [] } = lookForOpenDraft(ids, getElementsSelected);
        const labelID = tools.currentLocation();

        confirmModal.activate({
            params: {
                message,
                title: I18N.TITLE,
                cancel: confirmModal.deactivate,
                confirm: async () => {
                    confirmModal.deactivate();
                    await removeList(ids, context, labelID);

                    if (isDraftOpen) {
                        drafts.forEach((message) => {
                            $rootScope.$emit('composer.update', {
                                type: 'close.message',
                                data: { message }
                            });
                        });
                    }

                    notification.success(I18N.success(ids.length, I18N.TYPES[context](ids.length)));

                    $rootScope.showWelcome = false;
                    $rootScope.numberElementChecked = 0;
                    redirectUser();
                }
            }
        });
    };

    return remove;
}
export default removeElement;
