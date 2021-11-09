import { ApiEnvironmentConfigModel } from '@proton/shared/lib/models/apiEnvironmentConfigModel';
import { ApiEnvironmentConfig } from '@proton/shared/lib/interfaces';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<ApiEnvironmentConfig>(ApiEnvironmentConfigModel);
