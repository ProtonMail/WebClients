import { queryAddresses } from '../api/addresses';
import updateCollection from '../helpers/updateCollection';

export const getAddressesModel = (api) => {
    return api(queryAddresses()).then(({ Addresses }) => Addresses);
};

export const AddressesModel = {
    key: 'Addresses',
    get: getAddressesModel,
    update: updateCollection
};
