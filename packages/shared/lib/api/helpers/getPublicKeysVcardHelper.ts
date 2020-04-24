import { OpenPGPKey } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../../constants';
import { CRYPTO_PROCESSING_TYPES } from '../../contacts/constants';
import { readSigned } from '../../contacts/decrypt';
import { getKeyInfoFromProperties } from '../../contacts/keyProperties';
import { parse } from '../../contacts/vcard';

import { Api, PinnedKeysConfig } from '../../interfaces';
import { Contact, ContactEmail } from '../../interfaces/contacts';
import { getContact, queryContactEmails } from '../contacts';

/**
 * Get the public keys stored in the vcard of a contact associated to a certain email address.
 * Verify the signature on the contact in the process with the public keys provided
 */
const getPublicKeysVcardHelper = async (
    api: Api,
    Email: string,
    publicKeys: OpenPGPKey[]
): Promise<PinnedKeysConfig> => {
    try {
        const { ContactEmails = [] } = await api<{ ContactEmails: ContactEmail[] }>(
            queryContactEmails({ Email } as any)
        );
        if (!ContactEmails.length) {
            return { pinnedKeys: [], isContactSignatureVerified: false };
        }
        // pick the first contact with the desired email. The API returns them ordered by decreasing priority already
        const { Contact } = await api<{ Contact: Contact }>(getContact(ContactEmails[0].ContactID));
        // all the info we need is in the signed part
        const signedCard = Contact.Cards.find(
            ({ Type, Data }) => Type === CONTACT_CARD_TYPE.SIGNED && Data.includes(Email)
        );
        if (!signedCard) {
            throw new Error('Contact lacks signed card');
        }
        const { type, data: signedVcard } = await readSigned(signedCard, { publicKeys });
        const isContactSignatureVerified = type === CRYPTO_PROCESSING_TYPES.SUCCESS;
        const properties = parse(signedVcard);
        const emailProperty = properties.find(({ field, value }) => field === 'email' && value === Email);
        if (!emailProperty || !emailProperty.group) {
            throw new Error('Invalid vcard');
        }
        return { ...(await getKeyInfoFromProperties(properties, emailProperty.group)), isContactSignatureVerified };
    } catch (error) {
        return { pinnedKeys: [], isContactSignatureVerified: false, error };
    }
};

export default getPublicKeysVcardHelper;
