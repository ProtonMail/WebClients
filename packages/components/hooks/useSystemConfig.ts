import { SystemConfigModel } from '@proton/shared/lib/models/systemConfigModel';
import { SystemConfig } from '@proton/shared/lib/interfaces';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<SystemConfig>(SystemConfigModel);
