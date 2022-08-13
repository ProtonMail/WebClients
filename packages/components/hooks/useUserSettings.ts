import { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { UserSettingsModel } from '@proton/shared/lib/models/userSettingsModel';

import createUseModelHook from './helpers/createModelHook';

export default createUseModelHook<UserSettings>(UserSettingsModel);
