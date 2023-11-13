import { useRef } from 'react';

import { c } from 'ttag';

import {
    CalendarDrawerAppButton,
    CollapsingBreadcrumbs,
    ContactDrawerAppButton,
    DrawerSidebar,
    MainLogo,
    ModalsChildren,
    PrivateAppContainer,
    PrivateMainArea,
    SidebarPrimaryButton,
    useActiveBreakpoint,
    useToggle,
    useUser,
} from '@proton/components';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { ListView } from '../components/FileBrowser';
import { ListViewHeaderItem } from '../components/FileBrowser/interface';
import { DriveHeader } from '../components/layout/DriveHeader';
import { getDriveDrawerPermissions } from '../components/layout/drawerPermissions';
import DriveSidebar from '../components/layout/sidebar/DriveSidebar';
import { DriveItem } from '../components/sections/Drive/Drive';
import { ModifiedCell, NameCell, SizeCell } from '../components/sections/FileBrowser/contentCells';
import headerItems from '../components/sections/FileBrowser/headerCells';
import ToolbarRow from '../components/sections/ToolbarRow/ToolbarRow';

const desktopCells: React.FC<{ item: DriveItem }>[] = [NameCell, ModifiedCell, SizeCell];
const mobileCells = [NameCell];

const headerItemsDesktop: ListViewHeaderItem[] = [headerItems.name, headerItems.modificationDate, headerItems.size];

const headerItemsMobile: ListViewHeaderItem[] = [headerItems.name, headerItems.placeholder];

const DriveDummyContainer = () => {
    const [user] = useUser();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const { isDesktop } = useActiveBreakpoint();

    const logo = <MainLogo to="/" />;
    const dummyUploadButton = (
        <SidebarPrimaryButton className="hidden md:flex">{c('Action').t`New upload`}</SidebarPrimaryButton>
    );
    const dummyFolderTitle = c('Title').t`My files`;

    const header = <DriveHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />;

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={dummyUploadButton}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const items: DriveItem[] = [
        {
            id: 'dummy-link-1',
            parentLinkId: '',
            mimeType: 'text/plain',
            name: 'Private files',
            fileModifyTime: Date.now() / 1000,
            trashed: null,
            size: 1024 * 1024,
            isFile: false,
            hasThumbnail: false,
        },
        {
            id: 'dummy-link-2',
            parentLinkId: '',
            mimeType: 'text/plain',
            name: `Welcome to ${DRIVE_APP_NAME}.txt`,
            fileModifyTime: Date.now() / 1000,
            trashed: null,
            size: 1024 * 1024,
            isFile: true,
            hasThumbnail: false,
        },
    ];

    const headerItems = isDesktop ? headerItemsDesktop : headerItemsMobile;

    const Cells = isDesktop ? desktopCells : mobileCells;

    const permissions = getDriveDrawerPermissions({ user });
    const drawerSidebarButtons = [
        permissions.contacts && <ContactDrawerAppButton />,
        permissions.calendar && <CalendarDrawerAppButton />,
    ].filter(isTruthy);

    const canShowDrawer = drawerSidebarButtons.length > 0;
    return (
        <>
            <ModalsChildren />
            <PrivateAppContainer header={header} sidebar={sidebar}>
                <PrivateMainArea
                    hasToolbar
                    className="flex-no-min-children flex-column flex-nowrap "
                    drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                    drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                >
                    <div className="flex flex-column flex-nowrap w-full">
                        <ToolbarRow
                            titleArea={
                                <CollapsingBreadcrumbs
                                    breadcrumbs={[
                                        {
                                            key: 'my-files',
                                            text: c('Title').t`My files`,
                                            noShrink: true,
                                            highlighted: true,
                                        },
                                    ]}
                                />
                            }
                            toolbar={<></>}
                        />
                        <ListView
                            caption={dummyFolderTitle}
                            Cells={Cells}
                            headerItems={headerItems}
                            items={items}
                            loading={false}
                            scrollAreaRef={scrollAreaRef}
                        />
                    </div>
                </PrivateMainArea>
            </PrivateAppContainer>
        </>
    );
};

export default DriveDummyContainer;
