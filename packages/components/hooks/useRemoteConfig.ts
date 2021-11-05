import { RemoteConfigModel } from '@proton/shared/lib/models/remoteConfigModel';
import { RemoteConfig } from '@proton/shared/lib/interfaces';
import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<RemoteConfig>(RemoteConfigModel);
