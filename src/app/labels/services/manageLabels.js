import { LABEL_TYPE } from '../../constants';

/* @ngInject */
function manageLabels(
    gettextCatalog,
    confirmModal,
    eventManager,
    Label,
    labelsModel,
    networkActivityTracker,
    notification,
    translator
) {
    const I18N = translator(() => ({
        FOLDER: gettextCatalog.getString('folder', null, 'Title'),
        LABEL: gettextCatalog.getString('label', null, 'Title'),
        GROUP: gettextCatalog.getString('contact group', null, 'Title'),
        order(typeLabel = LABEL_TYPE.MESSAGE) {
            if (typeLabel === LABEL_TYPE.CONTACT_GROUP) {
                return gettextCatalog.getString('Contact group order saved', null, 'Success');
            }
            return gettextCatalog.getString('Label order saved', null, 'Success');
        },
        remove({ Exclusive }, typeLabel = LABEL_TYPE.MESSAGE, total = 1) {
            const isContactGroup = typeLabel === LABEL_TYPE.CONTACT_GROUP;
            const type = (() => {
                const value = Exclusive ? this.FOLDER : this.LABEL;
                return isContactGroup ? this.GROUP : value;
            })();

            const getMessage = () => {
                if (isContactGroup) {
                    if (total > 1) {
                        return gettextCatalog.getString(
                            'Are you sure you want to delete these contact groups ? Contacts in the group aren’t deleted if the contact group is deleted.',
                            null,
                            'Info'
                        );
                    }

                    return gettextCatalog.getString(
                        'Are you sure you want to delete this contact group ? Contacts in the group aren’t deleted if the contact group is deleted.',
                        null,
                        'Info'
                    );
                }

                if (Exclusive) {
                    return gettextCatalog.getString(
                        'Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.',
                        null,
                        'Info'
                    );
                }
                return gettextCatalog.getString(
                    'Are you sure you want to delete this label? Removing a label will not remove the messages with that label.',
                    null,
                    'Info'
                );
            };

            const NOTIF = gettextCatalog.getPlural(
                total,
                '{{type}} deleted.',
                '{{$count}} {{type}} deleted.',
                { type },
                'Success'
            );
            const title = gettextCatalog.getString('Delete {{type}}', { type }, 'Title');
            const message = getMessage();
            return { NOTIF, message, title };
        }
    }));

    const remove = (label, type) => {
        const total = !label.IDs ? 1 : label.IDs.length;
        const { message, title, NOTIF } = I18N.remove(label, type, total);

        const getIds = ({ ID, IDs = [] }) => {
            if (total === 1 && !(label.IDs || []).length) {
                return [ID];
            }
            return IDs;
        };

        return new Promise((resolve) => {
            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        const promise = Promise.all(getIds(label).map(Label.remove))
                            .then(eventManager.call)
                            .then(confirmModal.deactivate)
                            .then(() => notification.success(NOTIF))
                            .then(() => resolve(true));
                        networkActivityTracker.track(promise);
                    },
                    cancel() {
                        resolve(false);
                        confirmModal.deactivate();
                    }
                }
            });
        });
    };

    const saveOrder = async (LabelIDs, Type = LABEL_TYPE.MESSAGE) => {
        const SUCCESS = I18N.order(Type);
        const promise = Label.order({ LabelIDs, Type })
            .then(eventManager.call)
            .then(() => notification.success(SUCCESS));
        await networkActivityTracker.track(promise);
    };

    return { remove, saveOrder };
}
export default manageLabels;
