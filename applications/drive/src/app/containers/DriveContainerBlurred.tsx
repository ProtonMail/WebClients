import { useRef } from 'react';

import { c } from 'ttag';

import {
    CollapsingBreadcrumbs,
    FloatingButton,
    Icon,
    MainLogo,
    ModalsChildren,
    PrivateAppContainer,
    PrivateMainArea,
    SidebarPrimaryButton,
    useActiveBreakpoint,
    useToggle,
} from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { ListView } from '../components/FileBrowser';
import { ListViewHeaderItem } from '../components/FileBrowser/interface';
import { DriveHeader } from '../components/layout/DriveHeader';
import DriveSidebar from '../components/layout/DriveSidebar/DriveSidebar';
import { DriveItem } from '../components/sections/Drive/Drive';
import { ModifiedCell, NameCell, SizeCell } from '../components/sections/FileBrowser/contentCells';
import headerItems from '../components/sections/FileBrowser/headerCells';

const desktopCells: React.FC<{ item: DriveItem }>[] = [NameCell, ModifiedCell, SizeCell];
const mobileCells = [NameCell];

const headerItemsDesktop: ListViewHeaderItem[] = [headerItems.name, headerItems.modificationDate, headerItems.size];

const headerItemsMobile: ListViewHeaderItem[] = [headerItems.name, headerItems.placeholder];

const DriveContainerBlurred = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const { isDesktop } = useActiveBreakpoint();

    const logo = <MainLogo to="/" />;
    const dummyUploadButton = (
        <SidebarPrimaryButton className="no-mobile">{c('Action').t`New upload`}</SidebarPrimaryButton>
    );
    const dummyFolderTitle = c('Title').t`My files`;

    const header = (
        <DriveHeader
            logo={logo}
            floatingPrimary={
                <FloatingButton title={c('Action').t`New upload`}>
                    <Icon size={24} name="plus" className="mauto" />
                </FloatingButton>
            }
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

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

    return (
        <>
            <ModalsChildren />
            <PrivateAppContainer isBlurred header={header} sidebar={sidebar}>
                <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                    <div className="max-w100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
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
                    </div>
                    <ListView
                        caption={dummyFolderTitle}
                        Cells={Cells}
                        headerItems={headerItems}
                        items={items}
                        loading={false}
                        scrollAreaRef={scrollAreaRef}
                    />
                </PrivateMainArea>
            </PrivateAppContainer>
        </>
    );
};

export default DriveContainerBlurred;
