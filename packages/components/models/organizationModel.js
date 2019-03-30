import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import createUseModelHook from './helpers/createModelHook';

export const useOrganization = createUseModelHook(OrganizationModel);
