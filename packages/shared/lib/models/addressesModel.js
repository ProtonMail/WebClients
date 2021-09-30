import { queryAddresses } from '../api/addresses';
import queryPages from '../api/helpers/queryPages';
import updateCollection from '../helpers/updateCollection';

export const getAddressesModel = (api) => {
    return queryPages((page, pageSize) => {
        return api(
            queryAddresses({
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Addresses }) => Addresses);
    });
};

export const AddressesModel = {
    key: 'Addresses',
    get: getAddressesModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Address }) => Address }),
};
