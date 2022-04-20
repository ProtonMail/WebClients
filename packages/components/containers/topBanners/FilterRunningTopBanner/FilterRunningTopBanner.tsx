import { c } from 'ttag';
import { useEffect, useState } from 'react';

import TaskPoller from './helpers/TasksPoller';
import TopBanner from '../TopBanner';
import { useApi, useIsMounted, useFeature } from '../../../hooks';
import { FeatureCode } from '../..';

const FilterRunningTopBanner = () => {
    const { feature } = useFeature(FeatureCode.ApplyFilters);
    const [showBanner, setShowBanner] = useState(false);
    const api = useApi();
    const isMounted = useIsMounted();

    useEffect(() => {
        if (feature?.Value === true) {
            const TaskPollerInstance = new TaskPoller({
                api,
                isMounted,
                onTasksRunning: () => setShowBanner(true),
                onTasksDone: () => setShowBanner(false),
            });

            void TaskPollerInstance.start();
        }
    }, [feature?.Value]);

    return showBanner ? (
        <TopBanner
            className="bg-info"
            onClose={() => {
                setShowBanner(false);
            }}
        >
            {c('Action').t`Filters are being applied. This might take a few minutes.`}
        </TopBanner>
    ) : null;
};

export default FilterRunningTopBanner;
