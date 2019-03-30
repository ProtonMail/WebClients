import { UserSettingsModel } from 'proton-shared/lib/models/userSettingsModel';
import createUseModelHook from './helpers/createModelHook';

export const useUserSettings = createUseModelHook(UserSettingsModel);
