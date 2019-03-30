import { AddressesModel } from 'proton-shared/lib/models/addressesModel';
import createUseModelHook from './helpers/createModelHook';

export const useAddresses = createUseModelHook(AddressesModel);
