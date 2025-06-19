import { createAction } from '@reduxjs/toolkit';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import type { LabelChanges } from '../../../helpers/labels';
import type { MarkAsChanges } from '../../../hooks/optimistic/useOptimisticMarkAs';

export const optimisticApplyLabels = createAction<{
    ID: string;
    changes: LabelChanges;
    unreadStatuses?: { id: string; unread: number }[];
}>('message/optimistic/applyLabels');

export const optimisticMarkAs = createAction<{ ID: string; changes: MarkAsChanges }>('message/optimistic/markAs');

export const optimisticDelete = createAction<string[]>('message/optimistic/delete');

export const optimisticEmptyLabel = createAction<string>('message/optimistic/emptyLabel');

export const optimisticRestore = createAction<MessageState[]>('message/optimistic/restore');
