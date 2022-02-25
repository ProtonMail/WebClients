import { useApi, useEventManager } from '@proton/components';
import { moveAll, queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { diff } from '@proton/shared/lib/helpers/array';
import { useEffect, useRef, useState } from 'react';

const TASK_RUNNING_POLLING_INTERVAL = 2000;

export const useLabelTaskRunning = () => {
    const api = useApi();
    const { call } = useEventManager();

    const timeoutRef = useRef<NodeJS.Timeout>();
    const [labels, setLabels] = useState<string[]>([]);

    const pollTaskRunning = async () => {
        const finishedLabels = [];

        await call();

        for (let label of labels) {
            const result = await api<{ TasksRunning: any }>(queryMessageMetadata({ LabelID: label } as any));
            if (!result.TasksRunning[label]) {
                finishedLabels.push(label);
            }
        }

        const newLabels = diff(labels, finishedLabels);

        if (newLabels.length !== labels.length) {
            setLabels(newLabels);
        } else {
            setTimeout(pollTaskRunning, TASK_RUNNING_POLLING_INTERVAL);
        }
    };

    useEffect(() => {
        if (labels.length > 0 && timeoutRef.current === undefined) {
            timeoutRef.current = setTimeout(pollTaskRunning, TASK_RUNNING_POLLING_INTERVAL);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [labels]);

    const handleMoveAll = async (sourceLabelID: string, destinationLabelID: string) => {
        await api(moveAll({ SourceLabelID: sourceLabelID, DestinationLabelID: destinationLabelID }));

        setLabels([...labels, sourceLabelID]);
    };

    const showLabelTaskRunningBanner = labels.length > 0;

    return { handleMoveAll, showLabelTaskRunningBanner };
};
