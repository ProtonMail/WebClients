import { PublicKeyReference } from '@proton/crypto';

import { CONTACT_CARD_TYPE } from '../../constants';
import { CRYPTO_PROCESSING_TYPES } from '../../contacts/constants';
import { readSigned } from '../../contacts/decrypt';
import { getKeyInfoFromProperties } from '../../contacts/keyProperties';
import { parseToVCard } from '../../contacts/vcard';
import { CANONICALIZE_SCHEME, canonicalizeEmail } from '../../helpers/email';
import { Api, PinnedKeysConfig } from '../../interfaces';
import { ContactEmail, Contact as tsContact } from '../../interfaces/contacts';
import { getContact, queryContactEmails } from '../contacts';

const getContactEmail = async (
    emailAddress: string,
    contactEmailsMap: { [email: string]: ContactEmail | undefined } = {},
    api: Api
) => {
    // Simple normalize here, internal version is to aggressive relative to contacts emails
    const canonicalEmail = canonicalizeEmail(emailAddress);
    if (contactEmailsMap[canonicalEmail]) {
        return contactEmailsMap[canonicalEmail];
    }
    const { ContactEmails = [] } = await api<{ ContactEmails: ContactEmail[] }>(
        queryContactEmails({ Email: canonicalEmail })
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
    publicKeys: PublicKeyReference[],
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
        const vCardContact = parseToVCard(signedVcard);
        const emailProperty = (vCardContact.email || []).find(({ field, value }) => {
            const scheme = isInternal ? CANONICALIZE_SCHEME.PROTON : CANONICALIZE_SCHEME.DEFAULT;
            return (
                field === 'email' &&
                canonicalizeEmail(value as string, scheme) === canonicalizeEmail(emailAddress, scheme)
            );
        });
        if (!emailProperty || !emailProperty.group) {
            throw new Error('Invalid vcard');
        }
        return {
            ...(await getKeyInfoFromProperties(vCardContact, emailProperty.group)),
            isContact,
            isContactSignatureVerified,
            contactSignatureTimestamp,
        };
    } catch (error: any) {
        return { pinnedKeys: [], isContact, isContactSignatureVerified, contactSignatureTimestamp, error };
    }
};

export default getPublicKeysVcardHelper;
