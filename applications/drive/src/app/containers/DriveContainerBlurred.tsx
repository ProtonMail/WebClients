import { useRef } from 'react';
import { c } from 'ttag';

import {
    PrivateAppContainer,
    useToggle,
    MainLogo,
    FloatingButton,
    SidebarPrimaryButton,
    PrivateMainArea,
    CollapsingBreadcrumbs,
    ModalsChildren,
    Icon,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { LinkType } from '../interfaces/link';
import DriveSidebar from '../components/layout/DriveSidebar/DriveSidebar';
import DriveHeader from '../components/layout/DriveHeader';
import ListView from '../components/FileBrowser/ListView/ListView';

const DriveContainerBlurred = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const appName = getAppName(APPS.PROTONDRIVE);

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
                        isPreview
                        type="drive"
                        scrollAreaRef={scrollAreaRef}
                        caption={dummyFolderTitle}
                        shareId="dummy-share"
                        loading={false}
                        contents={[
                            {
                                LinkID: 'dummy-link-1',
                                ParentLinkID: '',
                                MIMEType: 'text/plain',
                                Name: 'Private files',
                                ModifyTime: Date.now() / 1000,
                                Trashed: null,
                                Size: 1024 * 1024,
                                Type: LinkType.FOLDER,
                                UrlsExpired: false,
                                HasThumbnail: false,
                            },
                            {
                                LinkID: 'dummy-link-2',
                                ParentLinkID: '',
                                MIMEType: 'text/plain',
                                Name: `Welcome to ${appName}.txt`,
                                ModifyTime: Date.now() / 1000,
                                Trashed: null,
                                Size: 1024 * 1024,
                                Type: LinkType.FILE,
                                UrlsExpired: false,
                                HasThumbnail: false,
                            },
                        ]}
                        selectedItems={[]}
                        onToggleItemSelected={noop}
                        clearSelections={noop}
                        onToggleAllSelected={noop}
                        selectItem={noop}
                    />
                </PrivateMainArea>
            </PrivateAppContainer>
        </>
    );
};

export default DriveContainerBlurred;
