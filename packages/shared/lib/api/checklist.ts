import type { CHECKLIST_DISPLAY_TYPE, ChecklistId, ChecklistKeyType, ChecklistType } from '../interfaces';

export const getChecklist = (checklistType: ChecklistType) => ({
    method: 'get',
    url: `core/v4/checklist/${checklistType}`,
});

export const seenCompletedChecklist = (checklistType: ChecklistType) => ({
    method: 'post',
    url: `core/v4/checklist/seen-completed-list/${checklistType}`,
});

export const getDriveChecklist = (checklistId: ChecklistId) => ({
    method: 'get',
    url: `drive/v2/checklist/${checklistId}`,
});

export const seenCompletedDriveChecklist = (checklistId: ChecklistId) => ({
    method: 'post',
    url: `drive/v2/checklist/${checklistId}/seen-completed-list`,
});

export const updateChecklistItem = (Item: ChecklistKeyType, Type: ChecklistType) => ({
    method: 'put',
    url: `core/v4/checklist/check-item`,
    data: {
        Item,
        Type,
    },
});
export const updateChecklistDisplay = (
    Display: Omit<CHECKLIST_DISPLAY_TYPE, CHECKLIST_DISPLAY_TYPE.FULL>,
    Type: ChecklistType
) => ({
    method: 'put',
    url: `core/v4/checklist/update-display`,
    data: {
        Display,
        Type,
    },
});
