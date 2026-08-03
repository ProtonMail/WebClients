import { createAsyncThunk } from '@reduxjs/toolkit';

import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import diff from '@proton/utils/diff';

import type { MailState, MailThunkExtra } from '../store';
import type { QueryResults, TaskRunningInfo } from './elementsTypes';

export const TASK_RUNNING_POLLING_INTERVAL = 10000;

/**
 * Each poll schedules the next one, so this thunk and `refreshTaskRunningTimeout` reference each
 * other, and they must stay in the same module to avoid a circular import. `no-use-before-define`
 * is enabled with `variables: true`, so whichever of the two comes second is reported even though
 * the reference only resolves at call time. Declaring the binding upfront and assigning it below is
 * what keeps this lint-clean; the alternative is a `const` pair with a scoped rule suppression.
 */
export let pollTaskRunning: ReturnType<typeof createAsyncThunk<TaskRunningInfo, undefined, MailThunkExtra>>;

export const refreshTaskRunningTimeout = (
    newLabelIDs: string[],
    { getState, dispatch }: { getState: () => unknown; dispatch: (action: any) => void }
): NodeJS.Timeout | undefined => {
    let timeoutID: NodeJS.Timeout | undefined = (getState() as MailState).elements.taskRunning.timeoutID;

    if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = undefined;
    }

    if (newLabelIDs.length > 0) {
        timeoutID = setTimeout(() => {
            void dispatch(pollTaskRunning());
        }, TASK_RUNNING_POLLING_INTERVAL);
    }

    return timeoutID;
};

pollTaskRunning = createAsyncThunk<TaskRunningInfo, undefined, MailThunkExtra>(
    'elements/pollTaskRunning',
    async (_, { dispatch, getState, extra }) => {
        const currentLabels = (getState() as MailState).elements.taskRunning.labelIDs;
        const finishedLabels = [];

        for (const label of currentLabels) {
            const result = await extra.api<QueryResults>(queryMessageMetadata({ LabelID: label }));
            const isLabelStillRunning =
                result?.TasksRunning && !Array.isArray(result.TasksRunning) && result.TasksRunning[label];

            if (!isLabelStillRunning) {
                finishedLabels.push(label);
            }
        }

        const labelIDs = diff(currentLabels, finishedLabels);

        const timeoutID = refreshTaskRunningTimeout(labelIDs, {
            getState,
            dispatch,
        });

        return { labelIDs, timeoutID };
    }
);
