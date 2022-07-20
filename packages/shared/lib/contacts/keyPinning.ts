import { c } from 'ttag';
import isTruthy from '@proton/utils/isTruthy';
import { PrivateKeyReference, PublicKeyReference, CryptoProxy } from '@proton/crypto';
import { CONTACT_CARD_TYPE } from '../constants';
import { CANONIZE_SCHEME, canonizeEmail } from '../helpers/email';
import { generateProtonWebUID } from '../helpers/uid';
import { ContactCard } from '../interfaces/contacts';
import { VCardProperty } from '../interfaces/contacts/VCard';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { readSigned } from './decrypt';
import { toKeyProperty } from './keyProperties';
import { createContactPropertyUid, getVCardProperties } from './properties';
import { parseToVCard, vCardPropertiesToICAL } from './vcard';

/**
 * Pin a public key in a contact. Give to it the highest preference
 * Public keys need to be passed to check signature validity of signed contact cards
 * Private keys (typically only the primary one) need to be passed to sign the new contact card with the new pinned key
 */
interface ParamsUpdate {
    contactCards: ContactCard[];
    emailAddress: string;
    isInternal: boolean;
    bePinnedPublicKey: PublicKeyReference;
    publicKeys: PublicKeyReference[];
    privateKeys: PrivateKeyReference[];
}
export const pinKeyUpdateContact = async ({
    contactCards,
    emailAddress,
    isInternal,
    bePinnedPublicKey,
    publicKeys,
    privateKeys,
}: ParamsUpdate): Promise<ContactCard[]> => {
    // get the signed card of the contact that contains the key properties. Throw if there are errors
    const [signedCard, ...otherCards] = contactCards.reduce<ContactCard[]>((acc, card) => {
        if (card.Type === CONTACT_CARD_TYPE.SIGNED) {
            acc.unshift(card);
        } else {
            acc.push(card);
        }
        return acc;
    }, []);
    const readSignedCard = await readSigned(signedCard, { publicKeys });
    if (readSignedCard.type !== CRYPTO_PROCESSING_TYPES.SUCCESS) {
        if (readSignedCard.error) {
            throw readSignedCard.error;
        }
        throw new Error('Unknown error');
    }
    const signedVcard = readSignedCard.data;

    // get the key properties that correspond to the email address
    const signedVCard = parseToVCard(signedVcard);
    const signedProperties = getVCardProperties(signedVCard);
    const emailProperty = signedProperties.find(({ field, value }) => {
        const scheme = isInternal ? CANONIZE_SCHEME.PROTON : CANONIZE_SCHEME.DEFAULT;
        return field === 'email' && canonizeEmail(value as string, scheme) === canonizeEmail(emailAddress, scheme);
    });
    const emailGroup = emailProperty?.group as string;
    const keyProperties = emailGroup
        ? signedProperties.filter((prop) => {
              return prop.field === 'key' && prop.group === emailGroup;
          })
        : undefined;
    if (!keyProperties) {
        throw new Error(c('Error').t`The key properties for ${emailAddress} could not be extracted`);
    }

    // add the new key as the preferred one
    const shiftedPrefKeyProperties = keyProperties.map((property) => ({
        ...property,
        params: {
            ...property.params,
            pref: String(Number(property.params?.pref) + 1),
        },
    }));
    const newKeyProperties = [
        await toKeyProperty({ publicKey: bePinnedPublicKey, group: emailGroup, index: 0 }),
        ...shiftedPrefKeyProperties,
    ];
    const untouchedSignedProperties = signedProperties.filter(
        ({ field, group }) => field !== 'key' || group !== emailGroup
    );
    const newSignedProperties = [...untouchedSignedProperties, ...newKeyProperties];

    // sign the new properties
    const toSignVcard: string = vCardPropertiesToICAL(newSignedProperties).toString();
    const signature = await CryptoProxy.signMessage({
        textData: toSignVcard,
        stripTrailingSpaces: true,
        signingKeys: privateKeys,
        detached: true,
    });
    const newSignedCard = {
        Type: CONTACT_CARD_TYPE.SIGNED,
        Data: toSignVcard,
        Signature: signature,
    };
    return [newSignedCard, ...otherCards];
};

/**
 * Create a contact with a pinned key. Set encrypt flag to true
 * Private keys (typically only the primary one) need to be passed to sign the new contact card with the new pinned key
 */
interface ParamsCreate {
    emailAddress: string;
    name?: string;
    isInternal: boolean;
    bePinnedPublicKey: PublicKeyReference;
    privateKeys: PrivateKeyReference[];
}
export const pinKeyCreateContact = async ({
    emailAddress,
    name,
    isInternal,
    bePinnedPublicKey,
    privateKeys,
}: ParamsCreate): Promise<ContactCard[]> => {
    const properties: VCardProperty[] = [
        { field: 'fn', value: name || emailAddress, uid: createContactPropertyUid() },
        { field: 'uid', value: generateProtonWebUID(), uid: createContactPropertyUid() },
        { field: 'email', value: emailAddress, group: 'item1', uid: createContactPropertyUid() },
        !isInternal && { field: 'x-pm-encrypt', value: 'true', group: 'item1', uid: createContactPropertyUid() },
        !isInternal && { field: 'x-pm-sign', value: 'true', group: 'item1', uid: createContactPropertyUid() },
        await toKeyProperty({ publicKey: bePinnedPublicKey, group: 'item1', index: 0 }),
    ].filter(isTruthy);
    // sign the properties
    const toSignVcard: string = vCardPropertiesToICAL(properties).toString();
    const signature = await CryptoProxy.signMessage({
        textData: toSignVcard,
        stripTrailingSpaces: true,
        signingKeys: privateKeys,
        detached: true,
    });
    const newSignedCard = {
        Type: CONTACT_CARD_TYPE.SIGNED,
        Data: toSignVcard,
        Signature: signature,
    };
    return [newSignedCard];
};
