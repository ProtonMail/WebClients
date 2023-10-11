import { ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    AppsDropdown,
    Icon,
    SettingsLink,
    Sidebar,
    SidebarContactItem,
    SidebarNav,
    useDrawer,
    useSubscription,
    useUser,
} from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { APPS, DRIVE_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { hasDrive, hasFree } from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useDebug } from '../../../../hooks/drive/useDebug';
import { ShareWithKey, useDefaultShare } from '../../../../store';
import { useCreateDevice } from '../../../../store/_shares/useCreateDevice';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: ReactNode;
    logo: ReactNode;
}

const DriveSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => {
    const { activeShareId } = useActiveShare();
    const { getDefaultShare } = useDefaultShare();
    const { toggleDrawerApp } = useDrawer();
    const debug = useDebug();

    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    const { createDevice } = useCreateDevice();

    useEffect(() => {
        void getDefaultShare().then(setDefaultShare);
    }, [getDefaultShare]);

    const displayContactsInHeader = useDisplayContactsWidget();

    const [user] = useUser();
    const [subscription] = useSubscription();
    const { isMember, isSubUser } = user;

    const shouldShowDriveUpsell = useMemo(() => {
        if (!subscription || isSubUser || isMember) {
            return false;
        }

        return hasFree(subscription) || hasDrive(subscription);
    }, [isMember, isSubUser, subscription]);

    /*
     * The sidebar supports multiple shares, but as we currently have
     * only one main share in use, we gonna use the default share only,
     * unless the opposite is decided.
     */
    const shares = defaultShare ? [defaultShare] : [];
    return (
        <Sidebar
            appsDropdown={<AppsDropdown app={APPS.PROTONDRIVE} />}
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={primary}
            version={<DriveSidebarFooter />}
            contactsButton={
                displayContactsInHeader && (
                    <SidebarContactItem
                        onClick={() => {
                            toggleHeaderExpanded();
                            toggleDrawerApp({ app: DRAWER_NATIVE_APPS.CONTACTS })();
                        }}
                    />
                )
            }
            growContent={false}
            extraFooter={
                shouldShowDriveUpsell && (
                    <ButtonLike
                        className="my-2 w-full flex gap-2 flex-align-items-center flex-justify-center"
                        as={SettingsLink}
                        color="norm"
                        shape="outline"
                        path={addUpsellPath(
                            '/upgrade',
                            getUpsellRefFromApp({
                                app: APPS.PROTONDRIVE,
                                feature: DRIVE_UPSELL_PATHS.SIDEBAR,
                                component: UPSELL_COMPONENT.BUTTON,
                            })
                        )}
                    >
                        <Icon name="cloud" />
                        {c('Storage').t`Get storage`}
                    </ButtonLike>
                )
            }
        >
            <SidebarNav>
                <div>
                    <DriveSidebarList shareId={activeShareId} userShares={shares} />
                </div>
            </SidebarNav>
            {debug ? <button onClick={createDevice}>Create device</button> : null}
        </Sidebar>
    );
};

export default DriveSidebar;
