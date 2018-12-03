import _ from 'lodash';
import { flow, filter, take, map, orderBy } from 'lodash/fp';

import { htmlEntities, unicodeTag } from '../../../helpers/string';
import { REGEX_EMAIL, EMAIL_FORMATING, AUTOCOMPLETE_DOMAINS, AWESOMEPLETE_MAX_ITEMS } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = EMAIL_FORMATING;
const DEFAULT_KEY_VALUE = 'Address';

/**
 * We don't want to list contact groups
 *   - when we autocomplete contacts
 *   - if you're a free user
 * @param  {String}  mode   Type of the autocomplete, emails/contacts
 * @param  {Boolean} isFree Is user is Free
 * @return {Function}         Filter
 */
export function filterContactGroup(mode, isFree) {
    return ({ isContactGroup }) => {
        if (mode === 'contactGroup') {
            return isContactGroup;
        }

        return !(mode === 'contact' && isContactGroup) && (isFree ? !isContactGroup : true);
    };
}

/**
 * Format the label of an address to display both the name and the address
 * @param  {String} Name
 * @param  {String} Email
 * @return {String}
 */
export function formatLabel(Name, Email = '', totalMember = '') {
    if (Email === Name || !Name) {
        return Email.trim();
    }

    const name = unicodeTag(Name);
    // Use case for a contact group
    if (!Email && Name) {
        return totalMember ? `${name} ${totalMember}` : name;
    }

    return `${htmlEntities(name).trim()} ${OPEN_TAG_AUTOCOMPLETE}${Email.trim()}${CLOSE_TAG_AUTOCOMPLETE}`;
}

/**
 * Get a list of default value + most commons domains
 * @param  {String} value
 * @return {Array}
 */
export const defaultDomainsList = (value = '') => {
    const [email, domain = ''] = value.split('@');
    return flow(
        filter((item) => item.includes(domain.toLowerCase())),
        map((domain) => {
            const value = `${email}@${domain}`;
            return { label: value, value, Name: value };
        }),
        take(AWESOMEPLETE_MAX_ITEMS)
    )(AUTOCOMPLETE_DOMAINS);
};

/**
 * Format any new email added to the collection
 * Extract Name and Email from a string
 *     Standard: Name <email>
 *     Outlook 2016: Name (email)
 * @param  {String} label
 * @param  {String} value
 * @param  {String} keyValue  Custom key configured as a return value
 * @return {Object}       {Name, Address}
 */
export const formatNewEmail = (label = '', value = '', keyValue = DEFAULT_KEY_VALUE) => {
    // We need to clean the label because the one comming from the autocomplete can contains some unicode
    const cleanLabel = unicodeTag(label, 'reverse');

    // Check if an user paste an email Name <email> || Name (email)
    if (REGEX_EMAIL.test(cleanLabel) && keyValue === DEFAULT_KEY_VALUE) {
        const [Name, adr = value] = cleanLabel.split(/<|\(/).map((str = '') => str.trim());
        // If the last >/) does not exist, keep the email intact
        const Address = /(>|\))$/.test(adr) ? adr.slice(0, -1) : adr;
        return { Name, Address };
    }

    return { Name: label.trim(), [keyValue]: value.trim() };
};

/* @ngInject */
function autocompleteEmailsModel($injector, dispatchers, userType) {
    const { on, dispatcher } = dispatchers(['ui', 'contactGroupModel']);

    const CACHE = {
        EMAILS: [],
        LABELS: Object.create(null)
    };

    /**
     * Store a cache to fix perf issue #7520 if we have too much contacts
       we don't need to perform this action every time we do the autocompletion
     * @param  {Array} keys    Types of event to trigger the cache refresh
     * @return {Function}     Event listener
     */
    const refreshCache = (keys, debounce = false) => {
        const cache = {};
        const cb = (type) => {
            _rAF(() => {
                CACHE.EMAILS = formatCacheEmails();
                dispatcher.ui('autocompleteContacts.updated', { type });
            });
        };

        return (e, { type }) => {
            if (keys.includes(type)) {
                /*
                    We store the call inside a cache because we debounce by TYPE,
                    not the call of the event listener itself.
                    Some events ex: contactUpdated can be triggered very often,
                    we don't want to perform a huge task often.
                 */
                if (!cache[type]) {
                    cache[type] = !debounce ? cb : _.debounce(cb, 300);
                }
                cache[type](type);
            }
        };
    };

    // We can get a lot of this key, so we debounce the CB
    on('contacts', refreshCache(['contactsUpdated'], true));
    on('contacts', refreshCache(['contactEmails.updated', 'resetContacts']));
    on('contactGroupModel', refreshCache(['cache.refresh']));

    on('logout', () => {
        CACHE.EMAILS.length = 0;
        CACHE.LABELS = Object.create(null);
    });

    const getList = () => {
        return $injector
            .get('contactGroupModel')
            .get()
            .concat($injector.get('contactEmails').get());
    };

    const getTotalMember = (ID, isContactGroup) => {
        if (isContactGroup) {
            const count = $injector.get('contactGroupModel').getNumber(ID);
            return count <= 0 ? '' : `(${count})`;
        }
    };

    const mapItems = ({ Name, Email, Color, ID, LastUsedTime }) => {
        const value = Email || ID;
        const isContactGroup = typeof Color !== 'undefined';
        const label = formatLabel(Name, Email, getTotalMember(ID, isContactGroup));
        return {
            label,
            value,
            Name,
            ID,
            isContactGroup,
            LastUsedTime
        };
    };

    /**
     * Default formating + sort for contacts emails
     * @return {Array}
     */
    function formatCacheEmails() {
        return flow(
            map(mapItems),
            orderBy(['LastUsedTime', 'label'], ['desc', 'asc'])
        )(getList());
    }

    /**
     * Filter the autocomplete list output
     * @param  {Array}   list
     * @param  {String}  value          Default value if there is no autocomplete
     * @param  {Boolean} strictEquality Return exact match
     * @return {Array}
     */
    const filterList = (list = [], value, strictEquality = false) => {
        const col = list.length ? list : [{ label: value, value }];
        return strictEquality ? _.filter(col, { value }) : col;
    };

    /**
     * Filter emails from our contacts to find by
     *     - Matching name
     *     - Emails starting with
     *
     * List contains available emails or the new one
     * hasAutocompletion if data are coming from us
     * @param  {String} mode            type of autocompletion
     * @param  {Object} cache            local cache for the autocomplete to filter what's already selected
     * @param  {String} val             Input value
     * @param  {Boolean} strictEquality  Filter the collection via ===
     * @return {Object} {list:Array, show:Boolean}
     */
    const filterContact = (mode, cache = {}) => (val = '', strictEquality = false) => {
        // Do not lowercase value as it might get used by the UI directy via filterList
        const value = unicodeTag(val.trim());
        const input = value.toLowerCase();

        const { isFree } = userType();

        // Prepare the CACHE if it's not available yet
        if (!CACHE.EMAILS.length) {
            CACHE.EMAILS = formatCacheEmails();
        }

        const collection = flow(
            filter(filterContactGroup(mode, isFree)),
            filter(({ label, Name, isContactGroup }) => {
                // or a contact group we take the name as it doesn't contains the number of member.
                const key = isContactGroup ? Name : label;
                return !cache[key] && label.toLowerCase().includes(input);
            }),
            take(AWESOMEPLETE_MAX_ITEMS)
        )(CACHE.EMAILS);

        /*
            it creates a map <escaped>:<label>
            because the lib does not support more keys than label/value
            and we need the unescaped value #4901
         */
        CACHE.LABELS = collection.reduce((acc, { label, Name }) => ((acc[label] = Name), acc), Object.create(null));

        const hasAutocompletion = !!collection.length;

        if (hasAutocompletion) {
            return {
                list: filterList(collection, value, strictEquality),
                hasAutocompletion
            };
        }

        // Display custom domain suggestion if no match -> only mode emails for the composer
        if (/@$/.test(value) && mode === 'emails') {
            const list = defaultDomainsList(value);
            return { list, hasAutocompletion: !!list.length };
        }

        return {
            list: [],
            hasAutocompletion: false
        };
    };

    /**
     * Create autocomplete model based on your contacts
     * @param  {Array}  previousList list of autocompleted items
     * @param  {String} keyValue     Type of key for the value: default Address
     * @return {Object}
     */
    return (previousList = [], { keyValue = DEFAULT_KEY_VALUE, mode = 'emails' } = {}) => {
        /*
            Prevent empty names if we only have the address
            (new email, no contact yet for this one)
            Store a map of existing items inside the autocomplete, to prevent #7703
         */
        const LOCAL_CACHE = {
            list: [],
            mapExisting: Object.create(null)
        };

        const all = () => LOCAL_CACHE.list;
        const debug = () => ({ LOCAL_CACHE, CACHE });
        const exist = (value) => LOCAL_CACHE.list.some((item) => item[keyValue] === value);
        const clear = () => {
            LOCAL_CACHE.list.length = 0;
            CACHE.LABELS = Object.create(null);
            LOCAL_CACHE.mapExisting = Object.create(null);
        };

        /**
         * Add new email to the list + store in the cache we added it
         * @param {Object} data email Object
         * @param {Object} originalItem Default config autocomplete item -> when we load the autocomplete component the 1st time
         */
        const addEmail = (data = {}, originalItem) => {
            // If the mail is not already inside the collection, add it
            if (!exist(data[keyValue])) {
                LOCAL_CACHE.list.push(data);

                const item = mapItems(originalItem || data);
                const key = data.isContactGroup ? item.label : data.label;

                // Store a ref to filter them out of the autocomplete list later
                LOCAL_CACHE.mapExisting[key || item.label] = item;
            }
        };

        /**
         * Add a new contact to the list
         *     - value can be an object if you need to send more data
         * @param  {String} options.label Label to display
         * @param  {String} options.value Value === email
         * @return {Number}
         */
        const add = ({ label, value = '' } = {}) => {
            // Advance use case, you can set the value to be an Object
            const isStringValue = typeof value === 'string';
            const val = isStringValue ? value : value.value;
            const data = formatNewEmail(CACHE.LABELS[label] || label, val, keyValue);
            addEmail({ label, ...data, ...(!isStringValue && value.data) });
        };

        /**
         * Remove a contact by its address
         * @param  {String} options.Address
         * @return {Array}
         */
        const remove = (cbRemove, cbExisting = _.noop) => {
            const item = LOCAL_CACHE.list.find(cbExisting);
            LOCAL_CACHE.list = LOCAL_CACHE.list.filter(cbRemove);

            // If we have a match, remove it from the existing as it's not inside the autocomplete anymore.
            if (item) {
                const key = Object.keys(LOCAL_CACHE.mapExisting).find((key) => {
                    return LOCAL_CACHE.mapExisting[key].ID === item.ID;
                });
                delete LOCAL_CACHE.mapExisting[key];
            }
            return LOCAL_CACHE.list;
        };

        const removeItem = (key, scope = keyValue) => {
            return remove(({ [scope]: removeKey }) => removeKey !== key, ({ [scope]: removeKey }) => removeKey === key);
        };

        const removeByAddress = (Address) => removeItem(Address, 'Address');

        /**
         * Update an address. Ensures that the list is still unique. If new address already exists, the old address will be removed.
         * @param {String} oldAddress
         * @param {String} newAddress
         * @param {String} newName
         */
        const updateEmail = (oldAddress, newAddress, newName) => {
            /*
                If the address has been updated, ensure that it is unique.
                If it already exists, delete the old address.
             */
            if (oldAddress !== newAddress && LOCAL_CACHE.list.some((email) => email.Address === newAddress)) {
                removeByAddress(oldAddress);
                return;
            }
            // If there is no text, you can't focus the contentEditable again, so remove it.
            if (!newAddress && !newName) {
                removeByAddress(oldAddress);
                return;
            }

            // Update the old Address with the new information.
            LOCAL_CACHE.list = LOCAL_CACHE.list.map((email) => {
                if (email.Address === oldAddress) {
                    return {
                        ...email,
                        Address: newAddress,
                        Name: newName
                    };
                }
                return email;
            });
        };

        /**
         * Remove the last contact from the list
         * @return {Array}
         */
        const removeLast = () => (LOCAL_CACHE.list.pop(), LOCAL_CACHE.list);

        /**
         * Check if there are contacts inside the collection
         * @return {Boolean}
         */
        const isEmpty = () => !LOCAL_CACHE.list.length;

        /**
         * Refresh model list by comparing with an other list
         * @param  {Array}  emails [ { Name, Address } ]
         */
        const refresh = (emails = []) => {
            const removeMap = _.keyBy(emails, keyValue);
            const addMap = _.keyBy(LOCAL_CACHE.list, keyValue);

            // Remove missing email first
            LOCAL_CACHE.list = LOCAL_CACHE.list.filter((item) => removeMap[item[keyValue]]);
            // Then add new one
            emails.forEach((email) => {
                if (!addMap[email[keyValue]]) {
                    addEmail(email);
                }
            });
        };

        previousList.forEach((item) =>
            addEmail(
                {
                    Name: item.Name || item[keyValue] || item.Address,
                    [keyValue]: item[keyValue],
                    mode,
                    // If it's about emails bind this key to filter by type
                    ...(keyValue === DEFAULT_KEY_VALUE && {
                        isContactGroup: !!item.isContactGroup
                    })
                },
                item
            )
        );

        return {
            filterContact: filterContact(mode, LOCAL_CACHE.mapExisting),
            formatInput: unicodeTag,
            all,
            add,
            remove,
            removeByAddress,
            removeLast,
            removeItem,
            updateEmail,
            isEmpty,
            clear,
            exist,
            debug,
            refresh
        };
    };
}

export default autocompleteEmailsModel;
