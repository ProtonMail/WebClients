import { OpenPGPKey, signMessage } from 'pmcrypto';
import { c } from 'ttag';
import { CONTACT_CARD_TYPE } from '../constants';
import { ContactCard, ContactProperty } from '../interfaces/contacts';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { readSigned } from './decrypt';
import { toKeyProperty } from './keyProperties';
import { parse, toICAL } from './vcard';

interface Params {
    contactCards: ContactCard[];
    emailAddress: string;
    bePinnedPublicKey: OpenPGPKey;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}

/**
 * Pin a public key in a contact. Give to it the highest preference
 * Public keys need to be passed to check signature validity of signed contact cards
 * Private keys (typically only the primary one) need to be passed to sign the new contact card with the new pinned key
 */
export const pinKey = async ({
    contactCards,
    emailAddress,
    bePinnedPublicKey,
    publicKeys,
    privateKeys
}: Params): Promise<ContactCard[]> => {
    // get the signed card of the contact that contains the key properties. Throw if there are errors
    const [signedCard, ...otherCards] = contactCards.reduce<ContactCard[]>((acc, card) => {
        if (card.Type === CONTACT_CARD_TYPE.SIGNED && card.Data.includes(emailAddress)) {
            acc.unshift(card);
        } else {
            acc.push(card);
        }
        return acc;
    }, []);
    const readSignedCard = await readSigned(signedCard, { publicKeys });
    if (readSignedCard.type !== CRYPTO_PROCESSING_TYPES.SUCCESS) {
        throw readSignedCard.error;
    }
    const signedVcard = readSignedCard.data;

    // get the key properties that correspond to the email address
    const signedProperties = parse(signedVcard);
    const emailProperty = signedProperties.find(({ field, value }) => field === 'email' && value === emailAddress);
    const emailGroup = emailProperty?.group as string;
    const keyProperties =
        emailGroup &&
        (signedProperties.filter(({ field, group }) => field === 'key' && group === emailGroup) as Required<
            ContactProperty
        >[]);
    if (!keyProperties) {
        throw new Error(c('Error').t`The key properties for ${emailAddress} could not be extracted`);
    }

    // add the new key as the preferred one
    const shiftedPrefKeyProperties = keyProperties.map((property) => ({ ...property, pref: property.pref + 1 }));
    const newKeyProperties = [
        toKeyProperty({ publicKey: bePinnedPublicKey, group: emailGroup, index: 0 }),
        ...shiftedPrefKeyProperties
    ];
    const untouchedSignedProperties = signedProperties.filter(
        ({ field, group }) => field !== 'key' || group !== emailGroup
    );
    const newSignedProperties = [...untouchedSignedProperties, ...newKeyProperties];

    // sign the new properties
    const toSignVcard = toICAL(newSignedProperties).toString();
    const newSignedCard = await signMessage({ data: toSignVcard, privateKeys, armor: true, detached: true }).then(
        ({ signature: Signature }) => {
            const card: ContactCard = {
                Type: CONTACT_CARD_TYPE.SIGNED,
                Data: toSignVcard,
                Signature
            };
            return card;
        }
    );
    return [newSignedCard, ...otherCards];
};
