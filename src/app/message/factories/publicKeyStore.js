import _ from 'lodash';

import { TIME, KEY_FLAGS } from '../../constants';
import { CONTACT_ERROR } from '../../errors';
import { toList } from '../../../helpers/arrayHelper';
import { getGroup } from '../../../helpers/vcard';
import { normalizeEmail } from '../../../helpers/string';
import { addGetKeys } from '../../../helpers/key';

/* @ngInject */
function publicKeyStore(addressesModel, dispatchers, keyCache, pmcw, contactEmails, Contact, contactKey) {
    const CACHE = {};
    const CACHE_TIMEOUT = TIME.HOUR;
    const usesDefaults = (contactEmail) => !contactEmail || contactEmail.Defaults;
    const { on } = dispatchers();

    /**
     * Retrieve the public keys of a email address from cache. This returns either a map from email -> public keys
     * or null in case there is no such value
     * @param email String
     * @return Object Map email -> public keys OR NULL
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
        if (contact.errors.includes(CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)) {
            // keys can't be trusted: the user has no keys. DO NOT fallback to api keys.
            return [contactEmail.ContactID, []];
        }
        const {
            [email]: { Keys }
        } = await keyCache.get([email]);
        // pmcw.getKeys is async so we have to call it first
        const keys = await addGetKeys(Keys, 'PublicKey');
        const compromisedKeys = keys.reduce((acc, { Flags, keys }) => {
            if (!(Flags & KEY_FLAGS.ENABLE_VERIFICATION)) {
                acc[pmcw.getFingerprint(keys[0])] = true;
            }
            return acc;
        }, {});
        // In case the pgp packet list contains multiple keys, only first one is taken.
        const parsedKeys = await Promise.all(
            emailKeys.map(async (emailKey) => ({
                ...emailKey,
                keys: await contactKey.parseKey(emailKey)
            }))
        );
        const publicKeys = parsedKeys.reduce((acc, { keys }) => {
            keys.length &&
                acc.push({
                    key: keys[0],
                    compromised: !!compromisedKeys[keys[0].primaryKey.getFingerprint()]
                });
            return acc;
        }, []);

        return [contactEmail.ContactID, publicKeys];
    };

    /**
     * Retrieves the pinned keys from the ProtonMail API
     * @param email The mail for which to return the pinned keys
     * @return {Promise} A promise returning a map from email to a list of armored keys.
     */
    const fromApi = async (email) => {
        const normEmail = normalizeEmail(email);

        const address = addressesModel.getByEmail(email);

        // fetch keys from contacts and from api
        // we don't support key pinning on own addresses.
        if (!address) {
            const contactResult = await fromContacts(normEmail);
            if (contactResult) {
                const [contactID, contactKeyList] = contactResult;
                CACHE.EMAIL_PUBLIC_KEY[normEmail] = {
                    timestamp: Date.now(),
                    pubKeys: contactKeyList,
                    contactID
                };
                return { [email]: contactKeyList };
            }
            // only verify with pinned keys.
            return { [email]: [] };
        }

        const { Keys } = address;
        const keys = await addGetKeys(Keys, 'PrivateKey');
        const pubKeys = keys.reduce((acc, { Flags, keys }) => {
            acc.push({ key: keys[0].toPublic(), compromised: !(Flags & KEY_FLAGS.ENABLE_VERIFICATION) });
            return acc;
        }, []);
        CACHE.EMAIL_PUBLIC_KEY[normEmail] = { timestamp: Date.now(), pubKeys };
        return { [email]: pubKeys };
    };
    /**
     * Retrieves the pinned keys for each given email address.
     * @param {Array} emails An array of emails for which we want to retrieve the pinned keys
     * @returns {Promise} A promise returning a map from email to a list of openpgp.js keys.
     */
    const get = async (emails = []) => {
        // retrieve the normalized emails from cache -> remove any null values -> combine them in one object
        const cachedKeys = emails.reduce((acc, email) => {
            const cache = fromCache(email);
            if (cache) {
                acc[email] = cache[email];
            }
            return acc;
        }, {});
        const uncachedEmails = _.filter(emails, (email) => !_.has(cachedKeys, email));
        return Promise.all(_.map(uncachedEmails, (email) => fromApi(email)))
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

    on('contacts', (event, { type, data: { events = [], contact = {} } = {} }) => {
        type === 'contactEvents' && contactEvents(events);
        type === 'contactUpdated' && contactUpdated(contact);
    });

    const clearCache = () => {
        CACHE.EMAIL_PUBLIC_KEY = {};
    };

    clearCache();

    on('logout', () => {
        clearCache();
    });

    return { get };
}
export default publicKeyStore;
