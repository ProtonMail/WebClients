/* @ngInject */
function generateKeyModel(Key, pmcw, setupKeys) {
    const STATE = {
        QUEUED: 0,
        GENERATING: 1,
        DONE: 2,
        SAVED: 3,
        ERROR: 4
    };

    const onSuccess = (address, key) => {
        address.state = STATE.SAVED;
        address.Keys = address.Keys || [];
        address.Keys.push(key);

        return address;
    };

    const getStates = () => STATE;

    const generate = async ({ numBits, passphrase, organizationKey, memberMap = {}, address }) => {
        try {
            address.state = STATE.GENERATING;
            const { privateKeyArmored: PrivateKey } = await pmcw.generateKey({
                userIds: [{ name: address.Email, email: address.Email }],
                passphrase,
                numBits
            });

            address.state = STATE.DONE;

            const member = memberMap[address.ID] || {};
            if (member.ID) {
                const keys = await setupKeys.generateAddresses([address], 'temp', numBits);
                const key = await setupKeys.memberKey('temp', keys[0], member, organizationKey);
                return onSuccess(address, key);
            }

            const { data } = await Key.create({ AddressID: address.ID, PrivateKey });
            return onSuccess(address, data.Key);
        } catch (err) {
            const { data = {} } = err || {};
            address.state = STATE.ERROR;
            throw new Error(data.Error);
        }
    };

    return { generate, getStates };
}
export default generateKeyModel;
