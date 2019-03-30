import { DomainsModel } from 'proton-shared/lib/models/domainsModel';
import createUseModelHook from './helpers/createModelHook';

export const useDomains = createUseModelHook(DomainsModel);
