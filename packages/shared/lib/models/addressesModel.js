import { getAllAddresses } from '../api/addresses';
import updateCollection from '../helpers/updateCollection';

export const AddressesModel = {
    key: 'Addresses',
    get: getAllAddresses,
    update: (model, events) => updateCollection({ model, events, item: ({ Address }) => Address }),
};
