import { MutableRefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';
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
    const { showDrawerSidebar, setShowDrawerSidebar, setAppInView } = useDrawer();

    /**
     * Set the showDrawerSidebar value by hand instead of using the setting
     * so that when the user clicks on the button, the update is instantaneous
     * If an app is currently opened in the DrawerApp, we also want to close it
     */
    const handleClick = () => {
        if (spotlightSeenRef && !spotlightSeenRef?.current) {
            spotlightSeenRef.current = true;
        }
        if (showDrawerSidebar) {
            setAppInView(undefined);
        }
        setShowDrawerSidebar(!showDrawerSidebar);
        return api(updateHideDrawer(showDrawerSidebar ? DRAWER_VISIBILITY.HIDE : DRAWER_VISIBILITY.SHOW));
    };

    const tooltipText = showDrawerSidebar ? c('Tooltip').t`Hide side panel` : c('Tooltip').t`Show side panel`;

    return (
        <Tooltip title={tooltipText} originalPlacement="left">
            <span
                className={clsx(
                    'drawer-visibility-control',
                    showDrawerSidebar
                        ? 'drawer-visibility-control--hide'
                        : 'drawer-visibility-control--show ui-standard'
                )}
            >
                <Button
                    className={clsx('mauto drawer-visibility-control-button', showDrawerSidebar && 'color-weak')}
                    size="small"
                    shape={showDrawerSidebar ? 'ghost' : 'solid'}
                    color="weak"
                    icon
                    onClick={handleClick}
                >
                    <Icon name={showDrawerSidebar ? 'chevron-right' : 'chevron-left'} />
                </Button>
            </span>
        </Tooltip>
    );
};

export default DrawerVisibilityButton;
