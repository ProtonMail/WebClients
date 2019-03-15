import _ from 'lodash';

import { uniqID } from '../../../helpers/string';

/* @ngInject */
function contactUI(gettextCatalog, contactTransformLabel, sanitize, translator) {

    const EMAIL_TYPE = ['email', 'home', 'work', 'other'];
    const TEL_TYPE = ['tel', 'mobile', 'work', 'fax', 'other'];
    const ADR_TYPE = ['adr', 'home', 'work', 'other'];
    const PERSONAL_TYPE = ['org', 'anniversary', 'bday', 'gender', 'nickname', 'role', 'title', 'url']; // Andy wants 'org' first

    const I18N = translator(() => ({
        name: gettextCatalog.getString('Name', null, 'Placeholder'),
        pgp: gettextCatalog.getString('Public key', null, 'Placeholder'),
        emailAddress: gettextCatalog.getString('Email address', null, 'Placeholder'),
        phoneNumber: gettextCatalog.getString('Phone number', null, 'Placeholder'),
        information: gettextCatalog.getString('Information', null, 'Placeholder'),
        note: gettextCatalog.getString('A note', null, 'Placeholder'),
        address: gettextCatalog.getString('Address', null, 'Placeholder'),
        custom: gettextCatalog.getString('Custom', null, 'Placeholder'),
        customField: gettextCatalog.getString('Custom field', null, 'Placeholder'),
        htmlMimeType: gettextCatalog.getString('Automatic', null, 'MIME type'),
        plaintextMimeType: gettextCatalog.getString('Plain Text', null, 'MIME type'),
        requireTLS: gettextCatalog.getString('Require', null, 'TLS type'),
        optionalTLS: gettextCatalog.getString('Opportunistic', null, 'TLS type'),
        noScheme: gettextCatalog.getString('Use Global Default', null, 'Default encryption scheme'),
        default: gettextCatalog.getString('Default', null, 'MIME type')
    }));

    const MAP_KEYS = {
        Key: { key: 'key', type: 'key' },
        Scheme: { key: 'x-pm-scheme', type: 'pm-scheme' },
        MIMEType: { key: 'x-pm-mimetype', type: 'pm-mimetype' },
        Encrypt: { key: 'x-pm-encrypt', type: 'pm-encrypt' },
        Sign: { key: 'x-pm-sign', type: 'pm-sign' },
        TLS: { key: 'x-pm-tls', type: 'pm-tls' },
        Name: { key: 'fn', type: 'fn' },
        Emails: { key: 'email', type: 'email' },
        Tels: { key: 'tel', type: 'tel' },
        Adrs: { key: 'adr', type: 'adr' },
        Customs: { key: 'x-custom', type: 'custom' },
        Notes: { key: 'note', type: 'note' },
        Photos: { key: 'photo', type: 'photo' },
        Categories: { key: 'categories', type: 'categories' }
    };

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

    function removeX(value = '') {
        const v = value.toLowerCase();

        if (v.startsWith('x-')) {
            return value.substring(2);
        }

        if (v.startsWith('x')) {
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
            hide: ['version', 'n', 'prodid', 'abuid', 'uid', 'categories'],
            inputType: 'text',
            defaultValue: ''
        };

        switch (type) {
            case 'Name':
                UI.autofocus = true;
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
                    add(
                        UI,
                        data.key,
                        removeX(data.type) || removeX(data.key),
                        getValue(data.value, UI),
                        data.params,
                        data.settings
                    );
                }
            });
        }

        if (!datas.length || (datas.length === 1 && _.includes(UI.hide, datas[0].key))) {
            const populated = populate(UI, type);
            add(UI, populated.key, populated.type, UI.defaultValue, populated.params, {});
        }

        UI.inputName = `name_${UI.placeholder.replace(/\W+|_/g, '')}`;
        UI.uuid = uniqID();
        return UI;
    }

    /**
     * Helper to get value from UI parameters
     * @param {*} value
     * @param {Object} UI attach to the value
     * @return {*}
     */
    function getValue(value, { mode, options }) {
        if (mode === 'select') {
            return _.find(options, value);
        }
        return value;
    }

    function populate(UI, type) {
        const key = findKey(UI);
        const Personals = { key, type: key };
        const MAP = { ...MAP_KEYS, Personals };
        return MAP[type];
    }

    function add(UI, type, label, val = '', params, settings) {
        const hide = _.includes(UI.hide, type);
        // val can be an Array (ex: type = 'adr')
        const value = Array.isArray(val)
            ? val.map((v) => sanitize.toTagUnicode(v, 'reverse'))
            : sanitize.toTagUnicode(val, 'reverse');

        UI.uuid = uniqID();
        UI.items.push({
            type,
            label: contactTransformLabel.toLang(label),
            value,
            hide,
            params,
            settings,
            uuid: uniqID()
        });
    }

    const remove = (UI, item) => UI.items.splice(UI.items.indexOf(item), 1);

    return { remove, add, initialize, populate };
}
export default contactUI;
