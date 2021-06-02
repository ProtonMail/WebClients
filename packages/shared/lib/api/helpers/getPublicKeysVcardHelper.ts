import { OpenPGPKey } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../../constants';
import { CRYPTO_PROCESSING_TYPES } from '../../contacts/constants';
import { readSigned } from '../../contacts/decrypt';
import { getKeyInfoFromProperties } from '../../contacts/keyProperties';
import { parse } from '../../contacts/vcard';
import { CANONIZE_SCHEME, canonizeEmail } from '../../helpers/email';

import { Api, PinnedKeysConfig } from '../../interfaces';
import { Contact as tsContact, ContactEmail } from '../../interfaces/contacts';
import { getContact, queryContactEmails } from '../contacts';

const getContactEmail = async (
    emailAddress: string,
    contactEmailsMap: { [email: string]: ContactEmail | undefined } = {},
    api: Api
) => {
    // Simple normalize here, internal version is to aggressive relative to contacts emails
    const canonicalEmail = canonizeEmail(emailAddress);
    if (contactEmailsMap[canonicalEmail]) {
        return contactEmailsMap[canonicalEmail];
    }
    const { ContactEmails = [] } = await api<{ ContactEmails: ContactEmail[] }>(
        queryContactEmails({ Email: canonicalEmail } as any)
    );
    return ContactEmails[0];
};

/**
 * Get the public keys stored in the vcard of a contact associated to a certain email address.
 * Verify the signature on the contact in the process with the public keys provided
 */
const getPublicKeysVcardHelper = async (
    api: Api,
    emailAddress: string,
    publicKeys: OpenPGPKey[],
    isInternal?: boolean,
    contactEmailsMap: { [email: string]: ContactEmail | undefined } = {}
): Promise<PinnedKeysConfig> => {
    let isContact = false;
    let isContactSignatureVerified;
    let contactSignatureTimestamp;
    try {
        const ContactEmail = await getContactEmail(emailAddress, contactEmailsMap, api);
        if (ContactEmail === undefined) {
            return { pinnedKeys: [], isContact };
        }
        isContact = true;
        // ContactEmail.Defaults flag informs if there is specific configuration in the contact for this email
        if (ContactEmail.Defaults === 1) {
            return { pinnedKeys: [], isContact };
        }
        // pick the first contact with the desired email. The API returns them ordered by decreasing priority already
        const { Contact } = await api<{ Contact: tsContact }>(getContact(ContactEmail.ContactID));
        // all the info we need is in the signed part
        const signedCard = Contact.Cards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
        if (!signedCard) {
            // contacts created by the server are not signed
            return { pinnedKeys: [], isContact: !!Contact.Cards.length };
        }
        const { type, data: signedVcard, signatureTimestamp } = await readSigned(signedCard, { publicKeys });
        isContactSignatureVerified = type === CRYPTO_PROCESSING_TYPES.SUCCESS;
        contactSignatureTimestamp = signatureTimestamp;
        const properties = parse(signedVcard);
        const emailProperty = properties.find(({ field, value }) => {
            const scheme = isInternal ? CANONIZE_SCHEME.PROTON : CANONIZE_SCHEME.DEFAULT;
            return field === 'email' && canonizeEmail(value as string, scheme) === canonizeEmail(emailAddress, scheme);
        });
        if (!emailProperty || !emailProperty.group) {
            throw new Error('Invalid vcard');
        }
        return {
            ...(await getKeyInfoFromProperties(properties, emailProperty.group)),
            isContact,
            isContactSignatureVerified,
            contactSignatureTimestamp,
        };
    } catch (error) {
        return { pinnedKeys: [], isContact, isContactSignatureVerified, contactSignatureTimestamp, error };
    }
};

export default getPublicKeysVcardHelper;
