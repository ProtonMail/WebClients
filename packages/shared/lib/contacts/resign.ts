import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';

import { CONTACT_CARD_TYPE } from '../constants';
import { ContactCard } from '../interfaces/contacts';

/**
 * Re-sign contact cards
 * Private keys (typically only the primary one) need to be passed to re-sign the contact cards
 * No public key is needed as we don't do signature verification (since we are re-signing anyway)
 */
interface Params {
    contactCards: ContactCard[];
    privateKeys: PrivateKeyReference[];
}
export const resignCards = async ({ contactCards, privateKeys }: Params): Promise<ContactCard[]> => {
    const signedCards = contactCards.filter((card) => card.Type === CONTACT_CARD_TYPE.SIGNED);
    const otherCards = contactCards.filter((card) => card.Type !== CONTACT_CARD_TYPE.SIGNED);
    const reSignedCards = await Promise.all(
        signedCards.map(async ({ Data }) => {
            const signature = await CryptoProxy.signMessage({
                textData: Data,
                stripTrailingSpaces: true,
                signingKeys: privateKeys,
                detached: true,
            });
            return {
                Type: CONTACT_CARD_TYPE.SIGNED,
                Data,
                Signature: signature,
            };
        })
    );
    return [...reSignedCards, ...otherCards];
};
