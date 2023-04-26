import { CHECKLIST_DISPLAY_TYPE, ChecklistId, ChecklistKeyType } from '../interfaces';

export const getChecklist = (checklistId: ChecklistId) => ({
    method: 'get',
    url: `core/v4/checklist/${checklistId}`,
});

export const seenCompletedChecklist = (checklistId: ChecklistId) => ({
    method: 'post',
    url: `core/v4/checklist/${checklistId}/seen-completed-list`,
});

export const getDriveChecklist = (checklistId: ChecklistId) => ({
    method: 'get',
    url: `drive/v2/checklist/${checklistId}`,
});

export const seenCompletedDriveChecklist = (checklistId: ChecklistId) => ({
    method: 'post',
    url: `drive/v2/checklist/${checklistId}/seen-completed-list`,
});

export const hidePaidUserChecklist = () => ({
    method: 'post',
    url: `core/v4/checklist/paying-user/hide`,
});

export const updateChecklistItem = (Item: ChecklistKeyType) => ({
    method: 'put',
    url: `core/v4/checklist/check-item`,
    data: {
        Item,
    },
});
export const updateChecklistDisplay = (Display: Omit<CHECKLIST_DISPLAY_TYPE, CHECKLIST_DISPLAY_TYPE.FULL>) => ({
    method: 'put',
    url: `core/v4/checklist/update-display`,
    data: {
        Display,
    },
});
