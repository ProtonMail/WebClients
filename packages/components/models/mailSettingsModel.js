import { MailSettingsModel } from 'proton-shared/lib/models/mailSettingsModel';
import createUseModelHook from './helpers/createModelHook';

export const useMailSettings = createUseModelHook(MailSettingsModel);
