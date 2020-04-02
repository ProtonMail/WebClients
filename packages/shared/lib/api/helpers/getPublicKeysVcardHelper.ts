import { c } from 'ttag';
import { CONTACT_CARD_TYPE } from '../../constants';
import { getKeyInfoFromProperties } from '../../contacts/keyProperties';
import { parse } from '../../contacts/vcard';
import { Api, PinnedKeysConfig } from '../../interfaces';
import { ContactEmail } from '../../interfaces/contacts';
import { getContact, queryContactEmails } from '../contacts';

/**
 * Get the public keys stored in the vcard of a contact associated to a certain email address
 */
const getPublicKeysVcardHelper = async (api: Api, Email: string): Promise<PinnedKeysConfig> => {
    const defaultConfig: PinnedKeysConfig = { pinnedKeys: [] };
    try {
        const { ContactEmails = [] } = await api<{ ContactEmails: ContactEmail[] }>(
            queryContactEmails({ Email } as any)
        );
        if (!ContactEmails.length) {
            return defaultConfig;
        }
        // pick the first contact with the desired email. The API returns them ordered by decreasing priority already
        const { Contact } = await api(getContact(ContactEmails[0].ContactID));
        // all the info we need is in the signed part
        const signedCard = Contact.Cards.find(({ Type }: { Type: number }) => Type === CONTACT_CARD_TYPE.SIGNED);
        const properties = parse(signedCard.Data);
        const emailProperty = properties.find(({ field, value }) => field === 'email' && value === Email);
        if (!emailProperty || !emailProperty.group) {
            throw new Error(c('Error').t`Invalid vcard`);
        }
        return getKeyInfoFromProperties(properties, emailProperty.group);
    } catch (error) {
        return { pinnedKeys: [], error };
    }
};

export default getPublicKeysVcardHelper;
