import { DomainsModel } from 'proton-shared/lib/models/domainsModel';
import { Address, Domain } from 'proton-shared/lib/interfaces';
import createUseModelHook from './helpers/createModelHook';

export interface EnhancedDomain extends Domain {
    addresses?: Address[];
}

export default createUseModelHook<EnhancedDomain[]>(DomainsModel);
