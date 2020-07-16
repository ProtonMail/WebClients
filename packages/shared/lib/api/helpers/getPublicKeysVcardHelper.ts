import { OpenPGPKey } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../../constants';
import { CRYPTO_PROCESSING_TYPES } from '../../contacts/constants';
import { readSigned } from '../../contacts/decrypt';
import { getKeyInfoFromProperties } from '../../contacts/keyProperties';
import { parse } from '../../contacts/vcard';
import { normalizeEmail } from '../../helpers/string';

import { Api, PinnedKeysConfig } from '../../interfaces';
import { Contact as tsContact, ContactEmail } from '../../interfaces/contacts';
import { getContact, queryContactEmails } from '../contacts';

/**
 * Get the public keys stored in the vcard of a contact associated to a certain email address.
 * Verify the signature on the contact in the process with the public keys provided
 */
const getPublicKeysVcardHelper = async (
    api: Api,
    emailAddress: string,
    publicKeys: OpenPGPKey[],
    isInternal?: boolean
): Promise<PinnedKeysConfig> => {
    let isContact = false;
    try {
        const { ContactEmails = [] } = await api<{ ContactEmails: ContactEmail[] }>(
            queryContactEmails({ Email: emailAddress } as any)
        );
        if (!ContactEmails.length) {
            return { pinnedKeys: [], isContact };
        }
        isContact = true;
        // pick the first contact with the desired email. The API returns them ordered by decreasing priority already
        const { Contact } = await api<{ Contact: tsContact }>(getContact(ContactEmails[0].ContactID));
        // all the info we need is in the signed part
        const signedCard = Contact.Cards.find(({ Type }) => Type === CONTACT_CARD_TYPE.SIGNED);
        if (!signedCard) {
            // contacts created by the server are not signed
            return { pinnedKeys: [], isContact: !!Contact.Cards.length, isContactSignatureVerified: true };
        }
        const { type, data: signedVcard } = await readSigned(signedCard, { publicKeys });
        const isContactSignatureVerified = type === CRYPTO_PROCESSING_TYPES.SUCCESS;
        const properties = parse(signedVcard);
        const emailProperty = properties.find(
            ({ field, value }) =>
                field === 'email' &&
                normalizeEmail(value as string, isInternal) === normalizeEmail(emailAddress, isInternal)
        );
        if (!emailProperty || !emailProperty.group) {
            throw new Error('Invalid vcard');
        }
        return {
            ...(await getKeyInfoFromProperties(properties, emailProperty.group)),
            isContact,
            isContactSignatureVerified,
        };
    } catch (error) {
        return { pinnedKeys: [], isContact, isContactSignatureVerified: false, error };
    }
};

export default getPublicKeysVcardHelper;
