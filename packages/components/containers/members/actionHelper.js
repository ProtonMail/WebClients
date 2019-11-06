import { encryptPrivateKey } from 'pmcrypto';
import { generateMemberToken, encryptMemberToken } from 'proton-shared/lib/keys/memberToken';
import { getKeyFlagsAddress } from 'proton-shared/lib/keys/keyFlags';
import { createMemberKeyRoute, setupMemberKeyRoute } from 'proton-shared/lib/api/memberKeys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { srpVerify } from 'proton-shared/lib/srp';
import { createKey } from 'proton-shared/lib/keys/keysManager';
import { generateAddressKey, generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';

/**
 * Setup the primary key for a member.
 * @param {Function} api
 * @param {Object} Member
 * @param {Object} Address
 * @param {string} password
 * @param {Object} organizationKey
 * @param {Object} encryptionConfig
 * @return {Promise<Array>} - The updated list of keys.
 */
export const setupMemberKey = async ({ api, Member, Address, password, organizationKey, encryptionConfig }) => {
    const { salt: keySalt, passphrase: memberMailboxPassword } = await generateKeySaltAndPassphrase(password);

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: Address.Email,
        passphrase: memberMailboxPassword,
        encryptionConfig
    });

    const memberKeyToken = generateMemberToken();
    const privateKeyArmoredOrganization = await encryptPrivateKey(privateKey, memberKeyToken);
    const organizationToken = await encryptMemberToken(memberKeyToken, organizationKey);

    const updatedKeys = createKey({
        keyID: 'temp',
        keys: [],
        flags: getKeyFlagsAddress(Address, []),
        privateKey
    });

    const newKey = updatedKeys.find(({ Key: { ID } }) => 'temp' === ID);

    const PrimaryKey = {
        UserKey: privateKeyArmored,
        MemberKey: privateKeyArmoredOrganization,
        Token: organizationToken
    };

    const {
        Member: {
            Keys: [Key]
        }
    } = await srpVerify({
        api,
        credentials: { password },
        config: setupMemberKeyRoute({
            MemberID: Member.ID,
            AddressKeys: [
                {
                    AddressID: Address.ID,
                    SignedKeyList: await getSignedKeyList(updatedKeys),
                    ...PrimaryKey
                }
            ],
            PrimaryKey,
            KeySalt: keySalt
        })
    });

    // Mutably update the key with the latest value from the API (sets the real ID etc).
    newKey.Key = Key;

    return updatedKeys;
};

/**
 * Create a member key.
 * @param {Function} api
 * @param {Object} Address
 * @param {Object} Member
 * @param {Array} keys
 * @param {Object} privateKey
 * @param {String} privateKeyArmored
 * @param {String} activationToken
 * @param {String} privateKeyArmoredOrganization
 * @param {String} organizationToken
 * @return {Promise<Array>} - The updated list of keys
 */
export const createMemberAddressKeys = async ({
    api,
    Address,
    Member,
    keys,
    privateKey,
    privateKeyArmored,
    activationToken,
    privateKeyArmoredOrganization,
    organizationToken
}) => {
    const newKeys = createKey({
        keys,
        keyID: 'temp',
        flags: getKeyFlagsAddress(Address, keys),
        privateKey
    });

    const newKey = newKeys.find(({ Key: { ID } }) => 'temp' === ID);
    const {
        Key: { Primary }
    } = newKey;

    const { MemberKey } = await api(
        createMemberKeyRoute({
            MemberID: Member.ID,
            AddressID: Address.ID,
            Activation: activationToken,
            UserKey: privateKeyArmored,
            Token: organizationToken,
            MemberKey: privateKeyArmoredOrganization,
            Primary,
            SignedKeyList: await getSignedKeyList(newKeys)
        })
    );

    // Mutably update the key with the latest value from the API (sets the real ID etc).
    newKey.Key = MemberKey;

    return newKeys;
};
