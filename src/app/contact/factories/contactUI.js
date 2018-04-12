import _ from 'lodash';
import { PACKAGE_TYPE, KNOWLEDGE_BASE } from '../../constants';
/* @ngInject */
function contactUI(gettextCatalog, contactTransformLabel, mailSettingsModel) {
    const EMAIL_TYPE = ['email', 'home', 'work', 'other'];
    const TEL_TYPE = ['tel', 'mobile', 'work', 'fax', 'other'];
    const ADR_TYPE = ['adr', 'home', 'work', 'other'];
    const PERSONAL_TYPE = ['org', 'anniversary', 'bday', 'gender', 'nickname', 'role', 'title', 'url']; // Andy wants 'org' first

    const I18N = {
        name: gettextCatalog.getString('Name', null, 'Placeholder'),
        pgp: gettextCatalog.getString('Public key', null, 'Placeholder'),
        scheme: gettextCatalog.getString('Cryptographic scheme', null, 'Placeholder'),
        encrypt: gettextCatalog.getString('Encrypt', null, 'Placeholder'),
        tls: gettextCatalog.getString('TLS', null, 'Placeholder'),
        sign: gettextCatalog.getString('Sign', null, 'Placeholder'),
        mimetype: gettextCatalog.getString('Composer mode', null, 'Placeholder'),
        emailAddress: gettextCatalog.getString('Email address', null, 'Placeholder'),
        phoneNumber: gettextCatalog.getString('Phone number', null, 'Placeholder'),
        information: gettextCatalog.getString('Information', null, 'Placeholder'),
        note: gettextCatalog.getString('A note', null, 'Placeholder'),
        address: gettextCatalog.getString('Address', null, 'Placeholder'),
        custom: gettextCatalog.getString('Custom', null),
        customField: gettextCatalog.getString('Custom field', null, 'Placeholder'),
        htmlMimeType: gettextCatalog.getString('Composer format', null, 'MIME type'),
        plaintextMimeType: gettextCatalog.getString('Plain Text', null, 'MIME type'),
        requireTLS: gettextCatalog.getString('Require', null, 'TLS type'),
        optionalTLS: gettextCatalog.getString('Opportunistic', null, 'TLS type'),
        noScheme: gettextCatalog.getString('Use Global Default', null, 'Default encryption scheme'),
        default: gettextCatalog.getString('Default', null, 'MIME type')
    };

    function removeX(value = '') {
        if (value.toLowerCase().startsWith('x-')) {
            return value.substring(2);
        }

        if (value.toLowerCase().startsWith('x')) {
            return value.substring(1);
        }

        return value;
    }

    function initialize(datas = [], type) {
        const UI = {
            allowCustom: false,
            allowMultiple: false,
            mode: 'singleLine',
            infinite: false,
            unique: false,
            sortable: false,
            sortableState: false,
            placeholder: '',
            iconClass: '',
            labels: [],
            items: [],
            hide: ['version', 'n', 'prodid', 'abuid', 'uid'],
            inputType: 'text',
            defaultValue: ''
        };

        switch (type) {
            case 'Key':
                UI.infinite = true;
                UI.sortable = true;
                UI.inputType = 'Key';
                UI.placeholder = I18N.pgp;
                UI.iconClass = 'fa-key';
                break;
            case 'Scheme':
                {
                    const defaultValue =
                        mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? 'PGP/Inline' : 'PGP/MIME';
                    UI.unique = true;
                    UI.placeholder = I18N.scheme;
                    UI.iconClass = 'fa-wrench';
                    UI.mode = 'select';
                    // Doesn't need to be translated: is universal.
                    UI.options = [
                        { value: 'null', name: I18N.noScheme + ` (${defaultValue})` },
                        { value: 'pgp-mime', name: 'PGP/MIME' },
                        { value: 'pgp-inline', name: 'PGP/Inline' }
                    ];
                    UI.defaultValue = UI.options[0];
                    UI.infoTooltip = gettextCatalog.getString(
                        'Select the PGP scheme to be used when signing or encrypting to an user. Note that PGP/Inline forces plain text messages. Click for more info.',
                        null,
                        ''
                    );
                    UI.infoLink = KNOWLEDGE_BASE.PGP_MIME_INLINE;
                }
                break;
            case 'MIMEType':
                UI.unique = true;
                UI.placeholder = I18N.mimetype;
                UI.iconClass = 'fa-paint-brush';
                UI.mode = 'select';
                UI.options = [
                    { value: 'null', name: I18N.htmlMimeType },
                    { value: 'text/plain', name: I18N.plaintextMimeType }
                ];
                UI.infoTooltip = gettextCatalog.getString(
                    'Composer format indicates that the format in the composer is used to send to this user. Plain Text indicates that the message will always be converted to plain text on send.',
                    null,
                    ''
                );
                UI.defaultValue = UI.options[0];
                break;
            case 'Encrypt':
                UI.unique = true;
                UI.placeholder = I18N.encrypt;
                UI.iconClass = 'fa-lock';
                UI.mode = 'toggle';
                UI.defaultValue = false;
                break;
            case 'Sign':
                UI.unique = true;
                UI.placeholder = I18N.sign;
                UI.iconClass = 'fa-key';
                UI.mode = 'toggle';
                UI.defaultValue = mailSettingsModel.get('Sign') === 1;
                break;
            case 'TLS':
                {
                    const defaultValue = mailSettingsModel.get('TLS') ? I18N.requireTLS : I18N.optionalTLS;
                    UI.unique = true;
                    UI.placeholder = I18N.tls;
                    UI.iconClass = 'fa-shield';
                    UI.mode = 'select';
                    UI.options = [
                        { value: 'null', name: I18N.default + ` (${defaultValue})` },
                        { value: 'required', name: I18N.requireTLS },
                        { value: 'opportunistic', name: I18N.optionalTLS }
                    ];
                    UI.defaultValue = UI.options[0];
                }
                break;
            case 'Name':
                UI.unique = true;
                UI.placeholder = I18N.name;
                UI.iconClass = 'fa-user';
                break;
            case 'Emails':
                UI.infinite = true;
                UI.sortable = true;
                UI.inputType = 'email';
                UI.placeholder = I18N.emailAddress;
                UI.iconClass = 'fa-envelope';
                UI.labels = EMAIL_TYPE.map((label) => contactTransformLabel.toLang(label));
                break;
            case 'Tels':
                UI.inputType = 'tel';
                UI.placeholder = I18N.phoneNumber;
                UI.iconClass = 'fa-phone';
                UI.labels = TEL_TYPE.map((label) => contactTransformLabel.toLang(label));
                break;
            case 'Adrs':
                UI.placeholder = I18N.address;
                UI.iconClass = 'fa-home';
                UI.mode = 'address';
                UI.labels = ADR_TYPE.map((label) => contactTransformLabel.toLang(label));
                break;
            case 'Personals':
                UI.placeholder = I18N.information;
                UI.iconClass = 'fa-address-card';
                UI.labels = PERSONAL_TYPE.map((label) => contactTransformLabel.toLang(label));
                break;
            case 'Notes':
                UI.placeholder = I18N.note;
                UI.iconClass = 'fa-sticky-note';
                UI.mode = 'multiLine';
                UI.unique = true;
                break;
            case 'Photos':
                UI.iconClass = 'fa-photo';
                UI.mode = 'photo';
                UI.unique = true;
                break;
            case 'Customs':
                UI.infinite = true;
                UI.placeholder = I18N.customField;
                UI.iconClass = 'fa-asterisk';
                UI.labels = [I18N.custom];
                UI.allowCustom = true;
                break;
            default:
                break;
        }

        UI.selectable = UI.labels.length > 1;

        if (datas.length) {
            UI.allowMultiple = true;
            datas.forEach((data) => {
                if (data.value || UI.unique) {
                    add(UI, data.key, removeX(data.type) || removeX(data.key), data.value, {}, data.settings);
                }
            });
        }

        if (!datas.length || (datas.length === 1 && _.includes(UI.hide, datas[0].key))) {
            const populated = populate(UI, type);
            add(UI, populated.key, populated.type, UI.defaultValue, {}, {});
        }

        UI.inputName = `name_${UI.placeholder.replace(/\W+|_/g, '')}`;

        return UI;
    }

    function populate(UI, type) {
        switch (type) {
            case 'Key':
                return { key: 'key', type: 'key' };
            case 'Scheme':
                return { key: 'x-pm-scheme', type: 'pm-scheme' };
            case 'MIMEType':
                return { key: 'x-pm-mimetype', type: 'pm-mimetype' };
            case 'Encrypt':
                return { key: 'x-pm-encrypt', type: 'pm-encrypt' };
            case 'Sign':
                return { key: 'x-pm-sign', type: 'pm-sign' };
            case 'TLS':
                return { key: 'x-pm-tls', type: 'pm-tls' };
            case 'Name':
                return { key: 'fn', type: 'fn' };
            case 'Emails':
                return { key: 'email', type: 'email' };
            case 'Tels':
                return { key: 'tel', type: 'tel' };
            case 'Adrs':
                return { key: 'adr', type: 'adr' };
            case 'Personals': {
                const key = findKey(UI);
                return { key, type: key };
            }
            case 'Customs':
                return { key: 'x-custom', type: 'custom' };
            case 'Notes':
                return { key: 'note', type: 'note' };
            case 'Photos':
                return { key: 'photo', type: 'photo' };
            default:
                break;
        }
    }

    /**
     * Found the first key not yet used or return one random from the list
     * @param {Object} UI
     * @param {Array} source
     * @return {String} type
     */
    function findKey({ items = [] }) {
        const types = _.map(items, 'type');
        const key = _.find(PERSONAL_TYPE, (type) => types.indexOf(type) === -1);
        return key || PERSONAL_TYPE[_.random(PERSONAL_TYPE.length - 1)];
    }

    function add(UI, type, label, value = '', params, settings) {
        const hide = _.includes(UI.hide, type);
        UI.items.push({ type, label: contactTransformLabel.toLang(label), value, hide, params, settings });
    }

    const remove = (UI, item) => UI.items.splice(UI.items.indexOf(item), 1);

    return { remove, add, initialize, populate };
}
export default contactUI;
