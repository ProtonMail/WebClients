import _ from 'lodash';
import { CONSTANTS, TIME } from '../../constants';
import { toList } from '../../../helpers/arrayHelper';
import { normalizeEmail } from '../../../helpers/string';
import { getGroup } from '../../../helpers/vcard';

/* @ngInject */
function publicKeyStore($rootScope, keyCache, pmcw, contactEmails, Contact, contactKey, authentication) {
    const CACHE = {};
    const CACHE_TIMEOUT = TIME.HOUR;
    const usesDefaults = (contactEmail) => !contactEmail || contactEmail.Defaults;

    /**
     * Retrieve the public keys of a email address from cache. This returns either a map from email -> public keys
     * or null in case there is no such value
     * @param string email
     * @returns {} Map email -> public keys OR NULL
     */
    const fromCache = (email) => {
        const normEmail = normalizeEmail(email);
        if (!_.has(CACHE.EMAIL_PUBLIC_KEY, normEmail)) {
            return null;
        }

        const { timestamp, pubKeys } = CACHE.EMAIL_PUBLIC_KEY[normEmail];

        if (timestamp + CACHE_TIMEOUT < Date.now()) {
            delete CACHE.EMAIL_PUBLIC_KEY[normEmail];
            return null;
        }

        return { [email]: pubKeys };
    };

    const fromContacts = async (email) => {
        const normEmail = normalizeEmail(email);
        const contactEmail = contactEmails.findEmail(normEmail, normalizeEmail);

        if (usesDefaults(contactEmail)) {
            // fallback to api keys
            return;
        }

        const contact = await Contact.get(contactEmail.ContactID);

        const keyList = toList(contact.vCard.get('key'));
        const emailList = toList(contact.vCard.get('email'));

        const group = getGroup(emailList, normEmail);
        if (!group) {
            // fallback to api keys
            return;
        }

        const matchesGroup = (prop) => prop.getGroup() === group;

        const emailKeys = _.filter(keyList, matchesGroup);
        if (!emailKeys.length) {
            // fallback to api keys
            return;
        }
        if (contact.errors.includes(CONSTANTS.CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)) {
            // keys can't be trusted: the user has no keys. DO NOT fallback to api keys.
            return [contactEmail.ContactID, []];
        }
        // In case the pgp packet list contains multiple keys, only first one is taken.
        const publicKeys = emailKeys
            .map(contactKey.parseKey)
            .map(([k = null]) => k)
            .filter(_.identity);

        return [contactEmail.ContactID, publicKeys];
    };

    const isOwnAddress = (email) =>
        _.map(authentication.user.Addresses, 'Email').includes(email.toLowerCase().replace(/\+[^@]*@/, ''));

    const fromApi = async (email) => {
        const normEmail = email.toLowerCase();
        // fetch keys from contacts and from api
        // we don't support key pinning on own addresses.
        if (!isOwnAddress(normEmail)) {
            const contactResult = await fromContacts(normEmail);
            if (contactResult) {
                const [contactID, contactKeyList] = contactResult;
                CACHE.EMAIL_PUBLIC_KEY[normEmail] = { timestamp: Date.now(), pubKeys: contactKeyList, contactID };
                return { [email]: contactKeyList };
            }
            // only verify with pinned keys.
            return { [email]: [] };
        }
        const { Keys } = authentication.user.Addresses.find(({ Email }) => Email === email);

        const keyObjects = Keys.map(({ PrivateKey }) => pmcw.getKeys(PrivateKey));
        const keyList = keyObjects.map(([k]) => k.toPublic());
        CACHE.EMAIL_PUBLIC_KEY[normEmail] = { timestamp: Date.now(), pubKeys: keyList };
        return { [email]: keyList };
    };

    const get = async (emails = []) => {
        // retrieve the normalized emails from cache -> remove any null values -> combine them in one object
        const cachedKeys = _.extend({}, ..._.filter(_.map(emails, fromCache), Boolean));
        const uncachedEmails = _.filter(emails, (email) => !_.has(cachedKeys, email));
        return Promise.all(_.map(uncachedEmails, fromApi))
            .then((apiKeys) => _.extend({}, ..._.filter(apiKeys)))
            .then((apiKeys) => _.extend({}, cachedKeys, apiKeys));
    };

    const contactEvents = (events) => {
        // Find by emails (e.g. create, update):
        events
            .filter(({ Contact }) => Contact)
            .forEach(({ Contact: { ContactEmails } }) =>
                ContactEmails.forEach(({ Email }) => delete CACHE.EMAIL_PUBLIC_KEY[Email])
            );
        // Find by ID (e.g. delete):
        events.forEach(({ ID }) => {
            _.keys(CACHE.EMAIL_PUBLIC_KEY)
                .filter((email) => CACHE.EMAIL_PUBLIC_KEY[email].contactID === ID)
                .forEach((email) => delete CACHE.EMAIL_PUBLIC_KEY[email]);
        });
    };

    const contactUpdated = ({ ContactEmails }) =>
        ContactEmails.forEach(({ Email }) => delete CACHE.EMAIL_PUBLIC_KEY[Email]);

    $rootScope.$on('contacts', (event, { type, data: { events = [], contact = {} } = {} }) => {
        type === 'contactEvents' && contactEvents(events);
        type === 'contactUpdated' && contactUpdated(contact);
    });

    const clearCache = () => {
        CACHE.EMAIL_PUBLIC_KEY = {};
    };

    clearCache();

    $rootScope.$on('logout', () => {
        clearCache();
    });

    return { get };
}
export default publicKeyStore;
