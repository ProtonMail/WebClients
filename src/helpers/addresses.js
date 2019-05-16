import { flow, sortBy, reduce } from 'lodash/fp';

/**
 * Mark the first address, where Status, Receive and Send are set to 1, as default
 * @param {Array} addresses
 * @returns {Array}
 */
export const markDefault = (addresses = []) => {
    const { adrs = [] } = flow(
        sortBy('Order'),
        reduce(
            (acc, address) => {
                const { Status, Receive, Send } = address;
                address.isDefault = false;

                if (!acc.found && Status && Receive && Send) {
                    acc.found = true;
                    address.isDefault = true;
                }

                acc.adrs.push(address);
                return acc;
            },
            { adrs: [], found: false }
        )
    )(addresses);

    return adrs;
};
