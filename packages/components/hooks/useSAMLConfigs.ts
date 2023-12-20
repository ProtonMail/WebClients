import { SSO } from '@proton/shared/lib/interfaces/SSO';
import { SamlSSOModel } from '@proton/shared/lib/models/samlSSOModel';

import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<SSO[]>(SamlSSOModel);
