import _ from 'lodash';

/* @ngInject */
function contactUI(gettextCatalog, tools, contactTransformLabel) {
    const EMAIL_TYPE = ['email', 'home', 'work', 'other'];
    const TEL_TYPE = ['tel', 'mobile', 'work', 'fax', 'other'];
    const ADR_TYPE = ['adr', 'home', 'work', 'other'];
    const PERSONAL_TYPE = ['org', 'anniversary', 'bday', 'gender', 'nickname', 'role', 'title', 'url']; // Andy wants 'org' first

    const I18N = {
        name: gettextCatalog.getString('Name', null, 'Placeholder'),
        emailAddress: gettextCatalog.getString('Email address', null, 'Placeholder'),
        phoneNumber: gettextCatalog.getString('Phone number', null, 'Placeholder'),
        information: gettextCatalog.getString('Information', null, 'Placeholder'),
        note: gettextCatalog.getString('A note', null, 'Placeholder'),
        address: gettextCatalog.getString('Address', null, 'Placeholder'),
        custom: gettextCatalog.getString('Custom', null),
        customField: gettextCatalog.getString('Custom field', null, 'Placeholder')
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
            inputType: 'text'
        };

        switch (type) {
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
                    add(UI, data.key, removeX(data.type) || removeX(data.key), data.value);
                }
            });
        }

        if (!datas.length || (datas.length === 1 && _.includes(UI.hide, datas[0].key))) {
            const populated = populate(UI, type);
            add(UI, populated.key, populated.type, '');
        }

        UI.inputName = `name_${UI.placeholder.replace(/\W+|_/g, '')}`;

        return UI;
    }

    function populate(UI, type) {
        switch (type) {
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

    function add(UI, type, label, value = '', params) {
        const hide = _.includes(UI.hide, type);
        UI.items.push({ type, label: contactTransformLabel.toLang(label), value, hide, params });
    }

    const remove = (UI, item) => UI.items.splice(UI.items.indexOf(item), 1);

    return { remove, add, initialize, populate };
}
export default contactUI;
