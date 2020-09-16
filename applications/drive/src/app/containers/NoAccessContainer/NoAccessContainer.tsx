import React, { useRef, useEffect } from 'react';
import {
    PrivateAppContainer,
    useToggle,
    MainLogo,
    FloatingButton,
    SidebarPrimaryButton,
    PrivateMainArea,
    CollapsingBreadcrumbs,
    useModals,
} from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import AppSidebar from '../../components/layout/AppSidebar';
import AppHeader from '../../components/layout/AppHeader';
import ListView from '../../components/FileBrowser/ListView/ListView';
import { LinkType } from '../../interfaces/link';
import NoAccessModal from './NoAccessModal';

const NoAccessContainer = () => {
    const { createModal } = useModals();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    useEffect(() => {
        createModal(<NoAccessModal />);
    }, []);

    const logo = <MainLogo to="/" />;
    const dummyUploadButton = <SidebarPrimaryButton>{c('Action').t`New upload`}</SidebarPrimaryButton>;
    const dummyFolderTitle = c('Title').t`My files`;

    const header = (
        <AppHeader
            logo={logo}
            floatingPrimary={<FloatingButton title={c('Action').t`New upload`} icon="plus" />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const sidebar = (
        <AppSidebar
            logo={logo}
            primary={dummyUploadButton}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    return (
        <PrivateAppContainer isBlurred header={header} sidebar={sidebar}>
            <PrivateMainArea hasToolbar className="flex-noMinChildren flex-column flex-nowrap">
                <div className="mw100 pt0-5 pb0-5 pl0-75 pr0-75 border-bottom">
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
                        },
                        {
                            LinkID: 'dummy-link-2',
                            ParentLinkID: '',
                            MIMEType: 'text/plain',
                            Name: 'Welcome to ProtonDrive.txt',
                            ModifyTime: Date.now() / 1000,
                            Trashed: null,
                            Size: 1024 * 1024,
                            Type: LinkType.FILE,
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
    );
};

export default NoAccessContainer;
