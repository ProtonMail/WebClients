import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function actionDnd(
    AppModel,
    dispatchers,
    ptDndModel,
    actionConversation,
    labelsModel,
    gettextCatalog,
    notification,
    ptDndNotification,
    mailSettingsModel,
    moveContactGroupHandler,
    translator
) {
    const I18N = translator(() => ({
        APPLY_LABEL: gettextCatalog.getString('Apply label', null, 'notification drag and drop'),
        star(total, type) {
            const message = gettextCatalog.getPlural(total, 'message', 'messages', {}, 'Type of item');
            const conversation = gettextCatalog.getPlural(total, 'conversation', 'conversations', {}, 'Type of item');
            return gettextCatalog.getString(
                'Star {{total}} {{type}}',
                {
                    type: type === 'conversation' ? conversation : message,
                    total
                },
                'notification drag and drop'
            );
        }
    }));

    const { dispatcher, on } = dispatchers(['elements', 'messageActions']);

    ptDndNotification.init();

    const move = (ids, type, labelID) => {
        if (type === 'conversation') {
            return actionConversation.move(ids, labelID);
        }
        dispatcher.messageActions('move', { ids, labelID });
    };

    const label = (list, type, labelID) => {
        const ids = _.map(list, 'ID');
        const label = labelsModel.read(labelID);
        const labels = [((label.Selected = true), label)];

        if (labelsModel.read(labelID, 'folders')) {
            return move(ids, type, labelID);
        }

        if (mailSettingsModel.get('AlsoArchive')) {
            move(ids, type, MAILBOX_IDENTIFIERS.archive);
        }

        if (type === 'conversation') {
            actionConversation.label(ids, labels);
        } else {
            dispatcher.messageActions('label', { messages: list, labels });
        }

        notification.success(`${I18N.APPLY_LABEL} ${label.Name}`);
    };

    const group = (list, type, ID) => {
        const manager = moveContactGroupHandler.manage('addToContact', 'contact');
        // We only need the ID, and Selected to filter labels
        manager([{ ID, Selected: true }], list);
    };

    const star = (list = [], type) => {
        list.forEach((model) => {
            dispatcher.elements('toggleStar', { model, type });
        });
        notification.success(I18N.star(list.length, type));
    };

    let selectedList;

    on('ptDnd', (e, { type, data }) => {
        // Dirty but the data lives in the scope, not inside a model :/
        if (type === 'drop') {
            selectedList = data.selectedList;
        }

        if (type === 'dropsuccess') {
            const { model, type } = ptDndModel.draggable.get(data.itemId);
            const list = AppModel.get('numberElementChecked') && selectedList ? selectedList : [model];
            const ids = _.map(list, 'ID');
            selectedList = undefined;

            if (data.type === 'label') {
                return label(list, type, data.value);
            }

            if (data.type === 'group') {
                return group(list, type, data.value);
            }

            if (data.value === 'starred') {
                return star(list, type);
            }

            move(ids, type, MAILBOX_IDENTIFIERS[data.value]);
        }
    });

    return { init: angular.noop };
}
export default actionDnd;
