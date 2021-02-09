import { OpenPGPKey, signMessage } from 'pmcrypto';
import { c } from 'ttag';
import { CONTACT_CARD_TYPE } from '../constants';
import { CANONIZE_SCHEME, canonizeEmail } from '../helpers/email';
import isTruthy from '../helpers/isTruthy';
import { generateProtonWebUID } from '../helpers/uid';
import { ContactCard, ContactProperty } from '../interfaces/contacts';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { readSigned } from './decrypt';
import { toKeyProperty } from './keyProperties';
import { parse, toICAL } from './vcard';

/**
 * Pin a public key in a contact. Give to it the highest preference
 * Public keys need to be passed to check signature validity of signed contact cards
 * Private keys (typically only the primary one) need to be passed to sign the new contact card with the new pinned key
 */
interface ParamsUpdate {
    contactCards: ContactCard[];
    emailAddress: string;
    isInternal: boolean;
    bePinnedPublicKey: OpenPGPKey;
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
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
    const signedProperties = parse(signedVcard);
    const emailProperty = signedProperties.find(({ field, value }) => {
        const scheme = isInternal ? CANONIZE_SCHEME.PROTON : CANONIZE_SCHEME.DEFAULT;
        return field === 'email' && canonizeEmail(value as string, scheme) === canonizeEmail(emailAddress, scheme);
    });
    const emailGroup = emailProperty?.group as string;
    const keyProperties = emailGroup
        ? signedProperties.filter((prop): prop is Required<ContactProperty> => {
              return prop.field === 'key' && prop.group === emailGroup;
          })
        : undefined;
    if (!keyProperties) {
        throw new Error(c('Error').t`The key properties for ${emailAddress} could not be extracted`);
    }

    // add the new key as the preferred one
    const shiftedPrefKeyProperties = keyProperties.map((property) => ({ ...property, pref: property.pref + 1 }));
    const newKeyProperties = [
        toKeyProperty({ publicKey: bePinnedPublicKey, group: emailGroup, index: 0 }),
        ...shiftedPrefKeyProperties,
    ];
    const untouchedSignedProperties = signedProperties.filter(
        ({ field, group }) => field !== 'key' || group !== emailGroup
    );
    const newSignedProperties = [...untouchedSignedProperties, ...newKeyProperties];

    // sign the new properties
    const toSignVcard = toICAL(newSignedProperties).toString();
    const { signature } = await signMessage({ data: toSignVcard, privateKeys, armor: true, detached: true });
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
    bePinnedPublicKey: OpenPGPKey;
    privateKeys: OpenPGPKey[];
}
export const pinKeyCreateContact = async ({
    emailAddress,
    name,
    isInternal,
    bePinnedPublicKey,
    privateKeys,
}: ParamsCreate): Promise<ContactCard[]> => {
    const properties: ContactProperty[] = [
        { field: 'fn', value: name || emailAddress },
        { field: 'uid', value: generateProtonWebUID() },
        { field: 'email', value: emailAddress, group: 'item1' },
        !isInternal && { field: 'x-pm-encrypt', value: 'true', group: 'item1' },
        !isInternal && { field: 'x-pm-sign', value: 'true', group: 'item1' },
        toKeyProperty({ publicKey: bePinnedPublicKey, group: 'item1', index: 0 }),
    ].filter(isTruthy);
    // sign the properties
    const toSignVcard = toICAL(properties).toString();
    const { signature } = await signMessage({ data: toSignVcard, privateKeys, armor: true, detached: true });
    const newSignedCard = {
        Type: CONTACT_CARD_TYPE.SIGNED,
        Data: toSignVcard,
        Signature: signature,
    };
    return [newSignedCard];
};
