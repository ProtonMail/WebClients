/* @ngInject */
function formatKeys(formatKey) {
    /**
     * Prepare addresses to add information in each keys
     * @param  {Array} addresses
     * @return {Promise} addreses
     */
    const formatKeys = (addresses = []) => {
        const promises = addresses.reduce((acc, address) => {
            const { Keys = [] } = address;
            const pKeys = Promise.all(Keys.map(formatKey));

            return acc.concat(pKeys.then((keys) => ({ ...address, Keys: keys })));
        }, []);

        return Promise.all(promises);
    };

    return formatKeys;
}

export default formatKeys;
