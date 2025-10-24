import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import SidebarPrimaryButton from '@proton/components/components/sidebar/SidebarPrimaryButton';
import clsx from '@proton/utils/clsx';

import { ProtonMeetSpotlightWrapper } from '../ProtonMeetSpotlightWrapper';

interface Props {
    collapsed: boolean;
    onCreateEvent?: () => void;
}

export const PrimaryButton = ({ collapsed, onCreateEvent }: Props) => {
    return (
        <Tooltip title={collapsed ? c('Action').t`New event` : null}>
            <ProtonMeetSpotlightWrapper>
                <SidebarPrimaryButton
                    data-testid="calendar-view:new-event-button"
                    disabled={!onCreateEvent}
                    onClick={() => {
                        onCreateEvent?.();
                    }}
                    className={clsx(
                        'hidden md:flex items-center justify-center flex-nowrap gap-2',
                        collapsed && 'px-0'
                    )}
                >
                    {collapsed ? (
                        <Icon name="plus" className="flex mx-auto my-0.5" alt={c('Action').t`New event`} />
                    ) : (
                        <span className="text-ellipsis">{c('Action').t`New event`}</span>
                    )}
                </SidebarPrimaryButton>
            </ProtonMeetSpotlightWrapper>
        </Tooltip>
    );
};
