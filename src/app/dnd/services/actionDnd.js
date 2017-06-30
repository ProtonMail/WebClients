angular.module('proton.dnd')
    .factory('actionDnd', ($rootScope, $state, CONSTANTS, ptDndModel, actionConversation, labelsModel, gettextCatalog, notify, ptDndNotification, authentication) => {

        const NOTIFS = {
            APPLY_LABEL: gettextCatalog.getString('Apply label', null, 'notification drag and drop'),
            star(total, type) {
                const message = gettextCatalog.getPlural(total, 'message', 'messages');
                const conversation = gettextCatalog.getPlural(total, 'conversation', 'conversations');
                return gettextCatalog.getString('Star {{total}} {{type}}', {
                    type: (type === 'conversation') ? conversation : message,
                    total
                }, 'notification drag and drop');
            }
        };

        ptDndNotification.init();

        const notifySuccess = (message) => notify({ message, classes: 'notification-success' });

        const move = (ids, type, labelID) => {
            if (type === 'conversation') {
                return actionConversation.move(ids, labelID);
            }
            $rootScope.$emit('messageActions', {
                action: 'move',
                data: { ids, labelID }
            });
        };

        const label = (list, type, labelID) => {
            const ids = _.pluck(list, 'ID');
            const label = labelsModel.read(labelID);
            const labels = [ (label.Selected = true, label) ];

            if (labelsModel.read(labelID, 'folders')) {
                return move(ids, type, labelID);
            }

            if (authentication.user.AlsoArchive) {
                move(ids, type, CONSTANTS.MAILBOX_IDENTIFIERS.archive);
            }

            if (type === 'conversation') {
                actionConversation.label(ids, labels);
            } else {
                $rootScope.$emit('messageActions', {
                    action: 'label',
                    data: { messages: list, labels }
                });
            }

            notifySuccess(`${NOTIFS.APPLY_LABEL} ${label.Name}`);
        };

        const star = (list = [], type) => {
            list.forEach((model) => {
                $rootScope.$emit('elements', {
                    type: 'toggleStar',
                    data: { model, type }
                });
            });
            notifySuccess(NOTIFS.star(list.length, type));
        };

        let selectedList;

        $rootScope.$on('ptDnd', (e, { type, data }) => {
            // Dirty but the data lives in the scope, not inside a model :/
            if (type === 'drop') {
                selectedList = data.selectedList;
            }

            if (type === 'dropsuccess') {

                const { model, type } = ptDndModel.draggable.get(data.itemId);
                const list = ($rootScope.numberElementChecked && selectedList) ? selectedList : [ model ];
                const ids = _.pluck(list, 'ID');
                selectedList = undefined;

                if (data.type === 'label') {
                    return label(list, type, data.value);
                }

                if (data.value === 'starred') {
                    return star(list, type);
                }

                move(ids, type, CONSTANTS.MAILBOX_IDENTIFIERS[data.value]);
            }
        });

        return { init: angular.noop };

    });
