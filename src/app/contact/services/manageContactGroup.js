import _ from 'lodash';

import { LABEL_TYPE } from '../../constants';

/* @ngInject */
function manageContactGroup(
    Label,
    Contact,
    gettextCatalog,
    confirmModal,
    notification,
    eventManager,
    networkActivityTracker,
    contactGroupModel,
    contactGroupModal,
    editComposerContactGroupModal,
    composerContactGroupSelection,
    emailsEncryptionFlags,
    dispatchers,
    contactEmails,
    userType
) {
    const { dispatcher } = dispatchers(['manageContactGroup']);

    const I18N = {
        saveSuccess(type, { label, group }) {
            if (type === 'update') {
                return gettextCatalog.getString('{{Name}} updated', { Name: label.Name }, 'Info');
            }
            return gettextCatalog.getString(
                '{{Name}} created with {{total}} contact(s)',
                { Name: label.Name, total: group.ContactIDs.length },
                'Info'
            );
        },
        saveError(code, { message, items = [] }) {
            const NOT_EXIST = 13075;
            const msg = {
                [NOT_EXIST]() {
                    const msg = gettextCatalog.getPlural(
                        items.length,
                        'The contact does not exist',
                        'These {{$count}} contacts do not exist',
                        {},
                        'Error'
                    );
                    const list = items.map((key) => `<li>${key}</li>`).join('');
                    return `${msg}<ul>${list}</ul>`;
                }
            };

            return msg[code]() || message;
        },
        remove({ Name }) {
            const NOTIF = gettextCatalog.getString('{{Name}} deleted', { Name }, 'Title');
            const title = gettextCatalog.getString('Delete {{Name}} from the group', { Name }, 'Title');
            const message = gettextCatalog.getString('Are you sure you want to delete this contact ?', null, 'Info');
            return { NOTIF, message, title };
        },
        toggleGroup: {
            label(n) {
                return gettextCatalog.getPlural(
                    n,
                    'Apply group success',
                    'Apply {{$count}} groups success',
                    {},
                    'Success'
                );
            },
            unlabel(n) {
                return gettextCatalog.getPlural(
                    n,
                    'Remove group success',
                    'Remove {{$count}} groups success',
                    {},
                    'Success'
                );
            }
        }
    };

    /**
     * Parse errors from the response as we have one object/email
     * @param  {Array}  options.Responses
     * @return {Object}                   {total:Number, errors:Object<Code:String>: {Error:<String>,items:Array<String>}}
     */
    const parseResponse = ({ Responses = [] }) => {
        const errors = Responses.reduce((acc, { ID, Response = {} }) => {
            if (!Response.Error) {
                return acc;
            }

            if (!acc[Response.Code]) {
                acc[Response.Code] = {
                    message: Response.Error,
                    items: []
                };
            }

            const { Name, Email } = contactEmails.getEmail(ID) || {};
            acc[Response.Code].items.push(Name || Email);
            return acc;
        }, {});
        return {
            total: Object.keys(errors).length,
            errors
        };
    };

    let previousLabel = {};

    /**
     * Create a new group with some emails
     * @param  {String} options.ID         ID of the group, if defined we update the group
     * @param  {String} options.Name       Group's Name
     * @param  {String} options.Color      Group's Color
     * @param  {Number} options.Display    We need it for the API :/
     * @param  {Array}  options.ContactEmailIDs List of email's ID to attach to the group
     * @param {Boolean} isContact          Attach contacts IDs instead of emails
     * @return {Promise}                    returns Object { label:<Object>, group: <Object> }
     */
    async function save(
        { ID = previousLabel.ID, Name = '', Color = '', Display = 0, ContactIDs = [] },
        isContact,
        isSilent
    ) {
        const action = ID ? 'update' : 'create';
        const label = await Label[action]({
            Name,
            Color,
            Type: LABEL_TYPE.CONTACT_GROUP,
            Display: 0,
            ...(ID && { ID, Display })
        });

        // Cache if you edit the previous label again
        previousLabel = label;

        const getRequest = (LabelID, IDs = [], isContact) => {
            if (!IDs.length) {
                return {};
            }

            const action = isContact ? 'label' : 'labelEmails';
            const key = isContact ? 'ContactIDs' : 'ContactEmailIDs';
            return Contact[action]({ LabelID, [key]: IDs });
        };

        const group = await getRequest(label.ID, ContactIDs, isContact);

        // As it does many requests the server gives us a complex response/request
        const errors = parseResponse(group);
        if (errors.total && !isSilent) {
            return Object.keys(errors.errors).forEach((key) => {
                notification.error(I18N.saveError(key, errors.errors[key]));
            });
        }

        if (errors.total && isSilent) {
            const errorsMsg = Object.keys(errors.errors).map((key) => {
                return I18N.saveError(key, errors.errors[key]);
            });
            return { label, group, errors, errorsMsg };
        }

        !isSilent && notification.success(I18N.saveSuccess(action, { label, group: { ContactIDs } }));
        previousLabel = {};
        return { label, group, errors };
    }

    /**
     * Remove an email from a group
     * @param  {Object} contact current Contact
     * @param  {Object} group   current Group
     * @return {Promise}
     */
    const remove = (contact, group) => {
        const { message, title, NOTIF } = I18N.remove(contact);

        const doRemove = async (contact, group) => {
            if (group.ID) {
                await Contact.unlabelEmails({
                    LabelID: group.ID,
                    ContactEmailIDs: [contact.ID]
                });
                confirmModal.deactivate();
                notification.success(NOTIF);
            }
            contactGroupModel.remove([contact.ID]);
            dispatcher.manageContactGroup('remove.contact', { contact });
        };

        if (!group.ID) {
            return doRemove(contact, group);
        }

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(doRemove(contact, group));
                }
            }
        });
    };

    const getContactInfo = ({ ID }) => {
        const promise = contactGroupModel.getExport(ID);
        networkActivityTracker.track(promise);
        return promise;
    };

    const edit = async (group, ID, previousModal) => {
        previousModal && previousModal.hide();
        const model = !ID ? group : contactGroupModel.read(ID);
        contactGroupModal.activate({
            params: {
                model,
                group: await getContactInfo(model),
                previousModal,
                async close() {
                    contactGroupModal.deactivate();
                    await networkActivityTracker.track(contactGroupModel.load(true));
                }
            }
        });
    };

    const getDraftInfo = async (ID, message, type) => {
        const model = contactGroupModel.read(ID);
        const config = await contactGroupModel.getExport(model.ID);
        const cache = composerContactGroupSelection(message.ID);
        const emailsCache = cache.getDraftConfig(type) || {};

        // This is the config created by the user, it may contains some contacts/groups not inside the user's contacts.
        const currentDraftEmails = emailsCache[model.ID] || [];

        // It can returns Groups if it fails to find it
        const emails = config.concat(currentDraftEmails).filter((item) => !item.Group);

        // If a contact still exists, don't duplicate it
        const groupList = _.uniq(emails, (item) => item.Address || item.Email);
        return { model, groupList };
    };

    /**
     * If the user is premium,
     * when the user clicks on a contact group inside a composer field,
     * we open a modal with the current config
     *  - Emails from the group
     *  - His configuration
     *
     * > His configuration can contains more emails than what's inside the group
     * (ex he removed emails from the group AFTER the draft creation)
     * We need to merge the user's config + the current config.     *
     *
     * @param  {String}   Address of the group === its ID
     * @param  {Object}   Current message of the composer
     * @param  {String}   Typeof item for the scope (ToList,CCList,BCCList)
     */
    const editComposer = async (ID, message, type) => {
        if (userType().isFree) {
            return;
        }

        const keys = emailsEncryptionFlags(message);

        /**
         * Load emails inside the group and encryption status attached
         * to the emails
         * @param  {String} ID Group's ID
         * @return {Promise}    Array of emails
         */
        const loadGroup = async () => {
            const { model, groupList } = await getDraftInfo(ID, message, type);
            await keys.sync(groupList);
            const group = keys.extendFromCache(groupList);
            return { group, model };
        };

        const { group, model } = await networkActivityTracker.track(loadGroup());

        editComposerContactGroupModal.activate({
            params: { type, model, message, group }
        });
    };

    /**
     * Add or remove a list of labels for a list of contacts or emails
     * @param  {String} action Type of action
     * @return {Function}        <LabelIDs:Array>, <selection:Array>
     */
    const toggleGroup = (action = 'label') => async (LabelIDs = [], selection = [], { isSilent, noEvent } = {}) => {
        if (!selection.length || !LabelIDs.length) {
            return;
        }

        const i18n = I18N.toggleGroup[action.replace(/emails/i, '')];
        const key = /email/i.test(action) ? 'ContactEmailIDs' : 'ContactIDs';

        const promise = Promise.all(
            LabelIDs.map((LabelID) => {
                return Contact[action]({
                    LabelID,
                    [key]: _.map(selection, 'ID')
                });
            })
        );

        const output = await networkActivityTracker.track(promise);
        if (!noEvent) {
            await eventManager.call();
        }
        !isSilent && notification.success(i18n(LabelIDs.length));
        return output;
    };

    return {
        remove,
        save,
        edit,
        editComposer,
        contact: {
            attach: toggleGroup(),
            detach: toggleGroup('unlabel')
        },
        email: {
            attach: toggleGroup('labelEmails'),
            detach: toggleGroup('unlabelEmails')
        }
    };
}
export default manageContactGroup;
