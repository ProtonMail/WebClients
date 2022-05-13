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
import noop from '@proton/utils/noop';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import DriveSidebar from '../components/layout/DriveSidebar/DriveSidebar';
import { DriveHeader } from '../components/layout/DriveHeader';
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
                                linkId: 'dummy-link-1',
                                parentLinkId: '',
                                mimeType: 'text/plain',
                                name: 'Private files',
                                createTime: Date.now() / 1000,
                                fileModifyTime: Date.now() / 1000,
                                trashed: null,
                                size: 1024 * 1024,
                                isFile: false,
                                hasThumbnail: false,
                                signatureAddress: 'dummy',
                            },
                            {
                                linkId: 'dummy-link-2',
                                parentLinkId: '',
                                mimeType: 'text/plain',
                                name: `Welcome to ${appName}.txt`,
                                createTime: Date.now() / 1000,
                                fileModifyTime: Date.now() / 1000,
                                trashed: null,
                                size: 1024 * 1024,
                                isFile: true,
                                hasThumbnail: false,
                                signatureAddress: 'dummy',
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
