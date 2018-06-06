import { ENCRYPTION_DEFAULT } from '../../constants';

/* @ngInject */
function setupKeys(passwords, pmcw, webcrypto, Key, memberApi) {
    /**
     * Generates key pairs for a list of addresses
     * @param  {Array}  addresses  array of addresses that require keys
     * @param  {String} passphrase mailbox password to encrypt keys with
     * @param  {Number} numBits    number of bits in each generated RSA key
     * @return {Promise<Array<Object>>} array of objects {AddressID:String, PrivateKey:String}
     */
    async function generateAddresses(addresses = [], passphrase = '', numBits = ENCRYPTION_DEFAULT) {
        const list = addresses.map(({ ID, Email: email } = {}) => {
            return pmcw
                .generateKey({
                    userIds: [{ name: email, email }],
                    passphrase,
                    numBits
                })
                .then(({ privateKeyArmored: PrivateKey }) => ({
                    AddressID: ID,
                    PrivateKey
                }));
        });
        return Promise.all(list);
    }

    async function generate(addresses = [], password = '', numBits = ENCRYPTION_DEFAULT) {
        const keySalt = passwords.generateKeySalt();
        const mailboxPassword = await passwords.computeKeyPassword(password, keySalt);

        return {
            mailboxPassword,
            keySalt,
            keys: await generateAddresses(addresses, mailboxPassword, numBits)
        };
    }

    /**
     * Generates an organization key
     * @param  {String} passphrase mailbox password to encrypt keys with
     * @param  {Number} numBits    number of bits in each generated RSA key
     * @return {Promise<Object>}   { key:Key, privateKeyArmored:String, publicKeyArmored:String }
     */
    function generateOrganization(passphrase, numBits) {
        return pmcw.generateKey({
            userIds: [
                {
                    name: 'not_for_email_use@domain.tld',
                    email: 'not_for_email_use@domain.tld'
                }
            ],
            passphrase,
            numBits
        });
    }

    /**
     * Decrypts a member token with the organization private key
     * @param  {String} Token or Activation  member key token
     * @param  {Object} privateKey           organization private key
     * @return {Object}                      {PrivateKey, decryptedToken}
     */
    async function decryptMemberToken({ Token, Activation, PrivateKey } = {}, orgPrivateKey = {}) {
        const { data: decryptedToken, verified } = await pmcw.decryptMessage({
            message: pmcw.getMessage(Token || Activation),
            privateKeys: [orgPrivateKey],
            publicKeys: orgPrivateKey.toPublic()
        });

        if (verified !== 1) {
            throw new Error('Signature verification failed');
        }
        return { PrivateKey, decryptedToken };
    }

    /**
     * Decrypts a member key using the decrypted member token
     * @param  {String} Token or Activation  member key token
     * @param  {Object} signingKey           organization private key
     * @return {Object}                      decrypted member key object
     */
    async function decryptMemberKey(key = {}, signingKey = {}) {
        const { PrivateKey, decryptedToken } = await decryptMemberToken(key, signingKey);
        return pmcw.decryptPrivateKey(PrivateKey, decryptedToken);
    }

    /**
     * Returns a member's decrypted primary key
     * @param  {Array<Key>} Keys             all of a member's keys
     * @param  {Object} organizationKey      organization private key
     * @return {Object}                      decrypted member's primary key
     */
    async function getPrimaryKey({ Keys = [] } = {}, organizationKey = {}) {
        if (!Keys.length) {
            throw new Error('User not set up');
        }

        return decryptMemberKey(Keys[0], organizationKey);
    }

    /**
     * Set up the payload for an API call to setup new keys or reset old keys
     * @param  {String} KeySalt              the key salt used when hashing the key password
     * @param  {Array<Object>} AddressKeys   array of address-level keys encrypted with new password
     * @param  {Object} organizationKey      organization private key
     * @param  {String} newPassword          the new key password
     * @return {Object}                      payload for API request
     */
    function prepareSetupPayload(KeySalt = '', AddressKeys = [], newPassword = '') {
        const payload = { KeySalt, AddressKeys };

        if (AddressKeys.length > 0) {
            payload.PrimaryKey = AddressKeys[0].PrivateKey;
        }

        if (newPassword.length) {
            return { payload, newPassword };
        }

        return {
            payload,
            newPassword: ''
        };
    }

    /**
     * Takes a member key and generates its encrypted token
     * @param  {String} password             the key password
     * @param  {Object} PrivateKey           member key
     * @param  {Array<Object>} keys          array of keys encrypted with new password
     * @param  {Object} privateKeys          organization private key
     * @return {Object}
     */
    async function processMemberKey(password = '', { PrivateKey, AddressID } = {}, privateKeys = {}) {
        const value = webcrypto.getRandomValues(new Uint8Array(128));
        const randomString = pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(value));

        const result = await pmcw.decryptPrivateKey(PrivateKey, password);
        const MemberKey = await pmcw.encryptPrivateKey(result, randomString);
        const { data: Token } = await pmcw.encryptMessage({
            data: randomString,
            publicKeys: privateKeys.toPublic(),
            privateKeys
        });

        return {
            AddressID: AddressID,
            UserKey: PrivateKey,
            MemberKey,
            Token
        };
    }

    /**
     * Takes member keys and generates their encrypted tokens
     * @param  {String} mailboxPassword      the key password
     * @param  {Array<Object>} keys          array of member keys
     * @param  {Object} privateKeys          organization private key
     * @return {Object}
     */
    function processMemberKeys(mailboxPassword = '', keys = [], organizationKey = {}) {
        const promises = keys.map((key) => processMemberKey(mailboxPassword, key, organizationKey));
        return Promise.all(promises);
    }

    const response = async ({ data }) => data.User || data.Member || data.MemberKey;

    /**
     * Reset a user's keys
     * @param  {String} keySalt              the key salt used when hashing the key password
     * @param  {Array<Object>} keys          array of keys encrypted with new password
     * @param  {String} password             the new key password
     * @param  {Object} params               additional parameters to add to request (token, username)
     * @return {Object}                      API response to key reset
     */
    function reset({ keySalt, keys }, password = '', params = {}) {
        const rv = prepareSetupPayload(keySalt, keys, password);
        const payload = { ...rv.payload, ...params };
        return Key.reset(payload, rv.newPassword).then(response);
    }

    /**
     * Setup a new user's keys
     * @param  {String} keySalt              the key salt used when hashing the key password
     * @param  {Array<Object>} keys          array of keys encrypted with new password
     * @param  {String} password             the new key password
     * @return {Object}                      API response to key setup
     */
    function setup({ keySalt, keys }, password = '') {
        const { payload, newPassword } = prepareSetupPayload(keySalt, keys, password);
        return Key.setup(payload, newPassword).then(response);
    }

    /**
     * Setup a member's keys
     * @param  {String} mailboxPassword      the new key password
     * @param  {String} keySalt              the key salt used when hashing the key password
     * @param  {Array<Object>} keys          array of keys encrypted with new password
     * @param  {String} password             temporary password
     * @param  {String} MemberID             ID for member
     * @param  {Object} organizationKey      organization private key
     * @return {Object}                      API response to member key setup
     */
    async function memberSetup({ mailboxPassword, keySalt, keys }, password = '', MemberID = '', organizationKey = {}) {
        const AddressKeys = await processMemberKeys(mailboxPassword, keys, organizationKey);
        return memberApi
            .setupKey(MemberID, password, {
                AddressKeys,
                KeySalt: keySalt,
                PrimaryKey: AddressKeys[0]
            })
            .then(response);
    }

    /**
     * Create a new member address key
     * @param  {String} tempPassword         the new key password
     * @param  {Object} key                  member key
     * @param  {Object} member               member object
     * @param  {Object} organizationKey      organization private key
     * @return {Object}                      API response to member key create
     */
    async function memberKey(tempPassword = '', key = '', member = {}, organizationKey = {}) {
        const primaryKey = await getPrimaryKey(member, organizationKey);
        const [user, org] = await Promise.all([
            processMemberKey(tempPassword, key, primaryKey),
            processMemberKey(tempPassword, key, organizationKey)
        ]);

        return memberApi
            .createKey(member.ID, {
                ...org,
                Activation: user.Token,
                UserKey: user.MemberKey
            })
            .then(response);
    }

    return {
        generateOrganization,
        generateAddresses,
        generate,
        decryptMemberKey,
        memberSetup,
        memberKey,
        setup,
        reset
    };
}

export default setupKeys;
