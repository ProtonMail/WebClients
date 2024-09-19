import type { MutableRefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { useApi, useDrawer } from '@proton/components/hooks';
import { updateHideDrawer } from '@proton/shared/lib/api/settings';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import './DrawerVisibilityButton.scss';

interface Props {
    spotlightSeenRef?: MutableRefObject<boolean>;
}

const DrawerVisibilityButton = ({ spotlightSeenRef }: Props) => {
    const api = useApi();
    const { showDrawerSidebar, setShowDrawerSidebar } = useDrawer();

    /**
     * Set the showDrawerSidebar value by hand instead of using the setting
     * so that when the user clicks on the button, the update is instantaneous
     */
    const handleClick = () => {
        if (spotlightSeenRef && !spotlightSeenRef?.current) {
            spotlightSeenRef.current = true;
        }
        setShowDrawerSidebar(!showDrawerSidebar);
        return api(updateHideDrawer(showDrawerSidebar ? DRAWER_VISIBILITY.HIDE : DRAWER_VISIBILITY.SHOW));
    };

    const tooltipText = showDrawerSidebar ? c('Tooltip').t`Hide side panel` : c('Tooltip').t`Show side panel`;

    return (
        <Tooltip title={tooltipText} originalPlacement="left">
            <span
                className={clsx(
                    'drawer-visibility-control hidden md:flex',
                    showDrawerSidebar
                        ? 'drawer-visibility-control--hide'
                        : 'drawer-visibility-control--show ui-standard'
                )}
            >
                <Button
                    className={clsx('m-auto drawer-visibility-control-button', showDrawerSidebar && 'color-weak')}
                    size="small"
                    shape={showDrawerSidebar ? 'ghost' : 'solid'}
                    color="weak"
                    icon
                    onClick={handleClick}
                    aria-expanded={showDrawerSidebar}
                >
                    <Icon
                        name={showDrawerSidebar ? 'chevrons-right' : 'chevrons-left'}
                        alt={c('Action').t`Show side panel`}
                    />
                </Button>
            </span>
        </Tooltip>
    );
};

export default DrawerVisibilityButton;
