import { ChecklistId } from '../interfaces';

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
