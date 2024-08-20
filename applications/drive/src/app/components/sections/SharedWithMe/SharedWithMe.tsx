import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import useNavigate from '../../../hooks/drive/useNavigate';
import type { EncryptedLink, useSharedWithMeView } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import type { ExtendedInvitationDetails } from '../../../store/_links/useLinksListing/usePendingInvitationsListing';
import { SortField } from '../../../store/_views/utils/useSorting';
import { sendErrorReport } from '../../../utils/errorHandling';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../FileBrowser';
import { GridViewItem } from '../FileBrowser/GridViewItemLink';
import { AcceptOrRejectInviteCell, NameCell, SharedByCell, SharedOnCell } from '../FileBrowser/contentCells';
import headerItems from '../FileBrowser/headerCells';
import { translateSortField } from '../SortDropdown';
import { getSelectedSharedWithMeItems } from '../helpers';
import EmptySharedWithMe from './EmptySharedWithMe';
import { SharedWithMeContextMenu } from './SharedWithMeItemContextMenu';

export interface SharedWithMeItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail?: boolean;
    isFile: boolean;
    mimeType: string;
    name: string;
    signatureIssues?: any;
    signatureAddress?: string;
    size: number;
    trashed: number | null;
    rootShareId: string;
    volumeId: string;
    sharedOn?: number;
    sharedBy?: string;
    parentLinkId: string;
    invitationDetails?: ExtendedInvitationDetails;
    acceptInvitation?: (invitationId: string) => Promise<void>;
    rejectInvitation?: (invitationId: string) => Promise<void>;
}

type Props = {
    shareId: string;
    sharedWithMeView: ReturnType<typeof useSharedWithMeView>;
};

const { CheckboxCell, ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: SharedWithMeItem }>[] = [
    CheckboxCell,
    NameCell,
    SharedByCell,
    ({ item }) => (item.isInvitation ? <AcceptOrRejectInviteCell item={item} /> : <SharedOnCell item={item} />),
    ContextMenuCell,
];
const smallScreenCells: React.FC<{ item: SharedWithMeItem }>[] = [
    CheckboxCell,
    NameCell,
    ({ item }) => (item.isInvitation ? <AcceptOrRejectInviteCell item={item} /> : null),
    ContextMenuCell,
];

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.sharedBy,
    headerItems.sharedOnDate,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];
type SharedWithMeSortFields = Extract<SortField, SortField.name | SortField.sharedBy | SortField.sharedOn>;
const SORT_FIELDS: SharedWithMeSortFields[] = [SortField.name, SortField.sharedBy, SortField.sharedOn];

const SharedWithMe = ({ sharedWithMeView }: Props) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink } = useNavigate();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { canUseDocs } = useDriveDocsFeatureFlag();

    const { layout, items, sortParams, setSorting, isLoading, acceptPendingInvitation, rejectPendingInvitation } =
        sharedWithMeView;

    const itemsWithAcceptReject = items.map((item) =>
        item.isInvitation
            ? {
                  ...item,
                  acceptInvitation: acceptPendingInvitation,
                  rejectInvitation: rejectPendingInvitation,
              }
            : item
    );

    const selectedItemIds = selectionControls!.selectedItemIds;
    const selectedBrowserItems = useMemo(
        () => getSelectedSharedWithMeItems(itemsWithAcceptReject, selectedItemIds),
        [itemsWithAcceptReject, selectedItemIds]
    );

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = itemsWithAcceptReject.find((item) => item.id === id);

            if (!item || item.isInvitation) {
                return;
            }
            document.getSelection()?.removeAllRanges();

            if (isProtonDocument(item.mimeType)) {
                void canUseDocs(item.rootShareId)
                    .then((canUse) => {
                        if (!canUse) {
                            return;
                        }

                        return openDocument({
                            linkId: item.linkId,
                            shareId: item.rootShareId,
                            openBehavior: 'tab',
                        });
                    })
                    .catch(sendErrorReport);
                return;
            }

            navigateToLink(item.rootShareId, item.linkId, item.isFile);
        },
        [navigateToLink, itemsWithAcceptReject]
    );

    const handleItemRender = (item: SharedWithMeItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(item.rootShareId, item.linkId, item.activeRevision.id);
        }
    };

    /* eslint-disable react/display-name */
    const GridHeaderComponent = useMemo(
        () =>
            ({ scrollAreaRef }: { scrollAreaRef: React.RefObject<HTMLDivElement> }) => {
                const activeSortingText = translateSortField(sortParams.sortField);
                return (
                    <GridHeader
                        isLoading={isLoading}
                        sortFields={SORT_FIELDS}
                        onSort={setSorting}
                        sortField={sortParams.sortField}
                        sortOrder={sortParams.sortOrder}
                        itemCount={items.length}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading]
    );

    if (!items.length && !isLoading) {
        return <EmptySharedWithMe />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <ContactEmailsProvider>
            <SharedWithMeContextMenu
                selectedBrowserItems={selectedBrowserItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Shared`}
                items={itemsWithAcceptReject}
                headerItems={headerItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItem}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemOpen={handleClick}
                onItemRender={handleItemRender}
                onSort={setSorting}
                onScroll={browserItemContextMenu.close}
            />
        </ContactEmailsProvider>
    );
};

export default SharedWithMe;
