import { ContactGroupsModel } from 'proton-shared/lib/models/contactGroupsModel';
import createUseModelHook from './helpers/createModelHook';

export const useContactGroups = createUseModelHook(ContactGroupsModel);
