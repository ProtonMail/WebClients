import { Domain } from '@proton/shared/lib/interfaces';
import { DomainsModel } from '@proton/shared/lib/models/domainsModel';

import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<Domain[]>(DomainsModel);
