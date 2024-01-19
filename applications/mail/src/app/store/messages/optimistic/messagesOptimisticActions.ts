import { createAction } from '@reduxjs/toolkit';

import { LabelChanges } from '../../../helpers/labels';
import { MarkAsChanges } from '../../../hooks/optimistic/useOptimisticMarkAs';
import { MessageState } from '../messagesTypes';

export const optimisticApplyLabels = createAction<{
    ID: string;
    changes: LabelChanges;
    unreadStatuses?: { id: string; unread: number }[];
}>('message/optimistic/applyLabels');

export const optimisticMarkAs = createAction<{ ID: string; changes: MarkAsChanges }>('message/optimistic/markAs');

export const optimisticDelete = createAction<string[]>('message/optimistic/delete');

export const optimisticEmptyLabel = createAction<string>('message/optimistic/emptyLabel');

export const optimisticRestore = createAction<MessageState[]>('message/optimistic/restore');
