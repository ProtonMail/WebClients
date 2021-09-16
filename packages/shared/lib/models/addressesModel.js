import { queryAddresses } from '../api/addresses';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';
import updateCollection from '../helpers/updateCollection';

export const getAddressesModel = (api) => {
    const pageSize = 100;

    const requestPage = (page) => {
        return api(
            queryAddresses({
                Page: page,
                PageSize: pageSize,
            })
        );
    };

    return queryPagesThrottled({
        requestPage,
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Addresses }) => Addresses).flat();
    });
};

export const AddressesModel = {
    key: 'Addresses',
    get: getAddressesModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Address }) => Address }),
};
