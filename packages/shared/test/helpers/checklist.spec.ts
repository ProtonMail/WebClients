import { APPS } from '@proton/shared/lib/constants';
import { getChecklistTypeFromID, getMailChecklistType } from '@proton/shared/lib/helpers/checklist';
import { ChecklistType, type UserSettings } from '@proton/shared/lib/interfaces';

describe('Checklist helpers', () => {
    describe('getChecklistTypeFromID', () => {
        it('should return the drive checklist type', () => {
            expect(getChecklistTypeFromID(APPS.PROTONDRIVE, 'get-started')).toEqual(ChecklistType.DriveUser);
            expect(getChecklistTypeFromID(APPS.PROTONDRIVE, 'paying-user')).toEqual(ChecklistType.DriveUser);
        });

        it('should return get-started checklist type', () => {
            expect(getChecklistTypeFromID(APPS.PROTONMAIL, 'get-started')).toEqual(ChecklistType.MailFreeUser);
        });

        it('should return paying-user checklist type', () => {
            expect(getChecklistTypeFromID(APPS.PROTONMAIL, 'paying-user')).toEqual(ChecklistType.MailPaidUser);
        });

        it('should return byoe-user checklist type', () => {
            expect(getChecklistTypeFromID(APPS.PROTONMAIL, 'byoe-user')).toEqual(ChecklistType.MailBYOEUser);
        });
    });

    describe('getMailChecklistID', () => {
        it('should return the expected free checklist type', () => {
            const userSettings = { Checklists: ['get-started', 'drive-onboarding'] } as UserSettings;
            expect(getMailChecklistType(userSettings, APPS.PROTONMAIL)).toEqual(ChecklistType.MailFreeUser);
        });

        it('should return the expected paid checklist type', () => {
            const userSettings = { Checklists: ['paying-user', 'drive-onboarding'] } as UserSettings;
            expect(getMailChecklistType(userSettings, APPS.PROTONMAIL)).toEqual(ChecklistType.MailPaidUser);
        });

        it('should return the expected BYOE checklist type', () => {
            const userSettings = { Checklists: ['byoe-user', 'drive-onboarding'] } as UserSettings;
            expect(getMailChecklistType(userSettings, APPS.PROTONMAIL)).toEqual(ChecklistType.MailBYOEUser);
        });
    });
});
