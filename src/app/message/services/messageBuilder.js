import _ from 'lodash';
import { flow, filter, sortBy } from 'lodash/fp';
import { CONSTANTS, MIME_TYPES } from '../../constants';

const { PLAINTEXT } = MIME_TYPES;

/**
 * Format the subject to add the prefix only when the subject
 * doesn't start with it
 * @param  {String} subject
 * @param  {String} prefix
 * @return {String}
 */
export function formatSubject(subject = '', prefix = '') {
    const hasPrefix = new RegExp(`^${prefix}`, 'i');
    return hasPrefix.test(subject) ? subject : `${prefix} ${subject}`;
}

/**
 * Omit user's adresses from a list
 * @param  {Array}  list
 * @param  {Array}  address UserAdresses
 * @return {Array}
 */
export const omitUserAddresses = (list = [], address = []) =>
    _.filter(list, ({ Address }) => address.indexOf(Address.toLowerCase()) === -1);

/**
 * Inject the inline images as attachement for embedded xray()
 * @param {Array} originalAttachements From the current message
 * return {String}
 */
export function injectInline({ Attachments = [] } = {}) {
    return Attachments.filter((attachement) => {
        const disposition = attachement.Headers['content-disposition'];
        const REGEXP_IS_INLINE = /^inline/i;

        return typeof disposition !== 'undefined' && REGEXP_IS_INLINE.test(disposition);
    });
}

/**
 * Select attachements depending on action
 * @param  {Object} message
 * @param  {String} action
 * @return {Array}
 */
export function pickAttachements(message = {}, action = 'new') {
    if (/^(reply|replyall)$/.test(action)) {
        return injectInline(message);
    }

    if (action === 'forward') {
        return message.Attachments || [];
    }

    return [];
}

/**
 * Find the current sender for a message
 * @param  {Object} options.Addresses  From the user
 * @param  {String} options.AddressID
 * @return {Object}
 */
export function findSender({ Addresses = [] } = {}, { AddressID = '' } = {}) {
    const enabledAddresses = flow(filter({ Status: 1 }), sortBy('Order'))(Addresses);

    let sender = enabledAddresses[0];

    if (AddressID) {
        const originalAddress = _.find(enabledAddresses, { ID: AddressID });
        originalAddress && (sender = originalAddress);
    }
    return sender || {};
}

export function createMessage({ Addresses = [] } = {}, { RE_PREFIX, FW_PREFIX } = {}) {
    const { FORWARD, REPLY_ALL, REPLY } = CONSTANTS;

    /**
     * Format and build a new message
     * @param  {Message} newMsg          New message to build
     * @param  {String} options.Subject from the current message
     * @param  {String} options.ToList  from the current message
     */
    function newCopy(
        newMsg,
        { Subject = '', ToList = [], CCList = [], BCCList = [], DecryptedBody = '', encryptedSubject = '' } = {},
        useEncrypted = false
    ) {
        newMsg.Subject = useEncrypted ? encryptedSubject : Subject;
        newMsg.ToList = ToList;
        newMsg.CCList = CCList;
        newMsg.BCCList = BCCList;
        DecryptedBody && newMsg.setDecryptedBody(DecryptedBody);
    }

    /**
     * Format and build a reply
     * @param  {Message} newMsg          New message to build
     * @param  {String} Subject          from the current message
     * @param  {String} ToList           from the current message
     * @param  {Array} ReplyTos          from the current message
     * @param  {Number} Type             from the current message
     */
    function reply(newMsg, origin = {}, useEncrypted = false) {
        newMsg.Action = REPLY;
        newMsg.Subject = formatSubject(useEncrypted ? origin.encryptedSubject : origin.Subject, RE_PREFIX);

        if (origin.Type === 2 || origin.Type === 3) {
            newMsg.ToList = origin.ToList;
        } else {
            newMsg.ToList = origin.ReplyTos;
        }
    }

    /**
     * Format and build a replyAll
     * @param  {Message} newMsg          New message to build
     * @param  {String} Subject          from the current message
     * @param  {String} ToList           from the current message
     * @param  {String} CCList           from the current message
     * @param  {String} BCCList          from the current message
     * @param  {Array} ReplyTos          from the current message
     * @param  {Number} Type             from the current message
     */
    function replyAll(
        newMsg,
        { Subject, Type, ToList, ReplyTos, CCList, BCCList, encryptedSubject = '' } = {},
        useEncrypted = false
    ) {
        newMsg.Action = REPLY_ALL;
        newMsg.Subject = formatSubject(useEncrypted ? encryptedSubject : Subject, RE_PREFIX);

        if (Type === 2 || Type === 3) {
            newMsg.ToList = ToList;
            newMsg.CCList = CCList;
            newMsg.BCCList = BCCList;
        } else {
            newMsg.ToList = ReplyTos;
            newMsg.CCList = _.union(ToList, CCList);

            // Remove user address in CCList and ToList
            const userAddresses = _.map(Addresses, ({ Email = '' }) => Email.toLowerCase());
            newMsg.CCList = omitUserAddresses(newMsg.CCList, userAddresses);
        }
    }

    /**
     * Format and build a forward
     * @param  {Message} newMsg          New message to build
     * @param  {String} options.Subject from the current message
     */
    function forward(newMsg, { Subject, encryptedSubject = '' } = {}, useEncrypted = false) {
        newMsg.Action = FORWARD;
        newMsg.ToList = [];
        newMsg.Subject = formatSubject(useEncrypted ? encryptedSubject : Subject, FW_PREFIX);
    }

    return { reply, replyAll, forward, newCopy };
}

/**
 * Load the correct default MIMEType for a message
 * Default case is the user setting
 * @param  {String} options.MIMEType Can be undefined for a draft
 * @param  {String} DraftMIMEType    User setting
 * @return {String}
 */
export const loadMimeType = ({ MIMEType }, DraftMIMEType) => MIMEType || DraftMIMEType;

/* @ngInject */
function messageBuilder(
    $filter,
    authentication,
    composerFromModel,
    gettextCatalog,
    mailSettingsModel,
    messageModel,
    prepareContent,
    confirmModal,
    signatureBuilder,
    textToHtmlMail
) {
    const { reply, replyAll, forward, newCopy } = createMessage(authentication.user, {
        RE_PREFIX: gettextCatalog.getString('Re:', null, 'Message'),
        FW_PREFIX: gettextCatalog.getString('Fw:', null, 'Message')
    });

    const I18N = {
        TITLE_ENCRYPTED_SUBJECT: gettextCatalog.getString('Encrypted Subject', null, 'Subject'),
        YES_CONFIRM: gettextCatalog.getString('Yes', null, 'Use encrypted subject as subject'),
        NO_CONFIRM: gettextCatalog.getString('No', null, 'Use unencrypted subject as subject'),
        encryptedSubjectMessage(msg) {
            return gettextCatalog.getString(
                `The selected message has an encrypted subject.
                ProtonMail does not support sending an encrypted subject. 
                Do you want to use "{{ encryptedSubject }}" instead of the original unencrypted subject
                 "{{ Subject }}"?`,
                msg,
                'Ask user to use encrypted subject'
            );
        }
    };

    /**
     * Convert string content to HTML
     * @param  {String} input
     * @param  {Object} message
     * @return {String}
     */
    function convertContent(input = '', { MIMEType = '' } = {}) {
        if (MIMEType === PLAINTEXT) {
            return textToHtmlMail.parse(input);
        }
        return input;
    }

    /**
     * Filter the body of the message before creating it
     * Allows us to clean it
     * @param  {String} input
     * @param  {Message} message
     * @return {String}
     */
    function prepareBody(input, message, action) {
        const content = convertContent(input, message);
        return prepareContent(content, message, {
            blacklist: ['*'],
            action
        });
    }

    function promptEncryptedSubject(currentMsg) {
        return new Promise((resolve) => {
            confirmModal.activate({
                params: {
                    title: I18N.TITLE_ENCRYPTED_SUBJECT,
                    message: I18N.encryptedSubjectMessage(currentMsg),
                    confirmText: I18N.YES_CONFIRM,
                    cancelText: I18N.NO_CONFIRM,
                    hideClose: true,
                    confirm() {
                        confirmModal.deactivate();
                        resolve(true);
                    },
                    cancel() {
                        confirmModal.deactivate();
                        resolve(false);
                    }
                }
            });
        });
    }

    async function handleAction(action, currentMsg = {}, newMsg = {}) {
        const useEncrypted = !!currentMsg.encryptedSubject && (await promptEncryptedSubject(currentMsg));

        action === 'new' && newCopy(newMsg, currentMsg, useEncrypted);
        action === 'reply' && reply(newMsg, currentMsg, useEncrypted);
        action === 'replyall' && replyAll(newMsg, currentMsg, useEncrypted);
        action === 'forward' && forward(newMsg, currentMsg, useEncrypted);
    }

    async function builder(action, currentMsg = {}, newMsg = {}) {
        newMsg.MIMEType = loadMimeType(currentMsg, mailSettingsModel.get('DraftMIMEType'));
        newMsg.RightToLeft = mailSettingsModel.get('RightToLeft');

        await handleAction(action, currentMsg, newMsg);

        newMsg.xOriginalTo = currentMsg.xOriginalTo;

        const { address } = composerFromModel.get(currentMsg);

        newMsg.AddressID = currentMsg.AddressID; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward
        newMsg.From = address;

        /* add inline images as attachments */
        newMsg.Attachments = pickAttachements(currentMsg, action);
        newMsg.NumEmbedded = 0;

        if (action !== 'new') {
            const previously = () => {
                return gettextCatalog.getString(
                    'On {{date}}, {{name}} {{address}} wrote:',
                    {
                        date: $filter('localReadableTime')(currentMsg.Time),
                        name: currentMsg.Sender.Name,
                        address: `&lt;${currentMsg.Sender.Address}&gt;`
                    },
                    'Message'
                );
            };
            newMsg.ParentID = currentMsg.ID;
            newMsg.setDecryptedBody(
                `‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐<br>
                ${previously()}<br>
                <blockquote class="protonmail_quote" type="cite">
                    ${prepareBody(currentMsg.getDecryptedBody(), currentMsg, action)}
                </blockquote><br>`
            );
        }

        return newMsg;
    }

    /**
     * Filter and clean the body of the message, and update the message body with the result.
     * @param {Message} message
     * @param {String} action
     * @returns {Message}
     */
    function prepare(message, action) {
        message.setDecryptedBody(prepareBody(message.getDecryptedBody(), message, action));
        return message;
    }

    /**
     * Bind defaults parameters for a messafe
     * @param {Message} message
     */
    function setDefaultsParams(message) {
        const sender = findSender(message);

        _.defaults(message, {
            Type: CONSTANTS.DRAFT,
            ToList: [],
            CCList: [],
            BCCList: [],
            Attachments: [],
            numTags: [],
            recipientFields: [],
            Subject: '',
            PasswordHint: '',
            IsEncrypted: 0,
            ExpirationTime: 0,
            From: sender,
            uploading: 0,
            toFocussed: false,
            autocompletesFocussed: false,
            ccbcc: false
        });
    }

    /**
     * Create a new message
     * @param  {String} action new|reply|replyall|forward
     * @param  {Message} currentMsg Current message to reply etc.
     * @return {Message}    New message formated
     */
    async function create(action = '', currentMsg = {}) {
        let newMsg = messageModel();
        setDefaultsParams(newMsg);
        newMsg = await builder(action, currentMsg, newMsg);
        newMsg.setDecryptedBody(signatureBuilder.insert(newMsg, { action }));
        return newMsg;
    }

    return { create, prepare, updateSignature: signatureBuilder.update };
}
export default messageBuilder;
