import { OpenPGPKey, signMessage } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../constants';
import { ContactCard } from '../interfaces/contacts';
import { readSigned } from './decrypt';

/**
 * Re-sign contact cards
 * Public keys need to be passed to check signature validity of signed contact cards
 * Private keys (typically only the primary one) need to be passed to re-sign the contact cards
 */
interface Params {
    contactCards: ContactCard[];
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}
export const resignCards = async ({ contactCards, publicKeys, privateKeys }: Params): Promise<ContactCard[]> => {
    const signedCards = contactCards.filter((card) => card.Type === CONTACT_CARD_TYPE.SIGNED);
    const otherCards = contactCards.filter((card) => card.Type !== CONTACT_CARD_TYPE.SIGNED);
    const signedVcards = await Promise.all(
        signedCards.map(async (card) => {
            const { data } = await readSigned(card, { publicKeys });
            return data;
        })
    );
    const reSignedCards = await Promise.all(
        signedVcards.map(async (vcard) => {
            const { signature } = await signMessage({ data: vcard, privateKeys, armor: true, detached: true });
            return {
                Type: CONTACT_CARD_TYPE.SIGNED,
                Data: vcard,
                Signature: signature
            };
        })
    );
    return [...reSignedCards, ...otherCards];
};
