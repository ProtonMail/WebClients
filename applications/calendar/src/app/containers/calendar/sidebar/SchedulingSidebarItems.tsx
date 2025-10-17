import { useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';

import { useScheduling } from '../../scheduling/schedulingProvider/SchedulingProvider';
import { useSchedulingAvailability } from '../../scheduling/useSchedulingAvailability';

interface Props {
    headerRef: React.RefObject<HTMLDivElement>;
}

// TODO have an empty state placeholder
// TODO handle the state of the plus button
export const SchedulingSidebarItems = ({ headerRef }: Props) => {
    const [displayScheduling, setDisplayScheduling] = useState(true);

    const isSchedulingAvailable = useSchedulingAvailability();
    const { createNewSchedulingPage } = useScheduling();

    if (!isSchedulingAvailable) {
        return null;
    }

    const handleCreate = () => {
        createNewSchedulingPage();
    };

    return (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayScheduling}
                onToggle={() => setDisplayScheduling((prevState) => !prevState)}
                text={c('Link').t`Scheduling pages`}
                testId="calendar-sidebar:scheduling-pages-button"
                headerRef={headerRef}
                right={
                    <Tooltip title={c('Action').t`Create a new scheduling page`}>
                        <button
                            type="button"
                            className="flex navigation-link-header-group-control shrink-0"
                            onClick={handleCreate}
                            data-testid="navigation-link:create-scheduling-page"
                        >
                            <Icon name="plus" alt={c('Action').t`Create a new scheduling page`} />
                        </button>
                    </Tooltip>
                }
                spaceAbove
            />
        </SidebarList>
    );
};
