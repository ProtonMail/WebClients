import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { type ChecklistId, ChecklistType, type UserSettings } from '@proton/shared/lib/interfaces';

export const getChecklistTypeFromID = (app: APP_NAMES, id?: ChecklistId) => {
    if (app === APPS.PROTONDRIVE) {
        return ChecklistType.DriveUser;
    } else {
        switch (id) {
            case 'get-started':
                return ChecklistType.MailFreeUser;
            case 'paying-user':
                return ChecklistType.MailPaidUser;
            case 'byoe-user':
                return ChecklistType.MailBYOEUser;
        }
    }
};

export const getMailChecklistType = (userSettings: UserSettings, app: APP_NAMES) => {
    const ids =
        (userSettings.Checklists?.filter((checklist: string) => checklist !== 'drive-onboarding') as ChecklistId[]) ||
        [];
    return getChecklistTypeFromID(app, ids[0]);
};
