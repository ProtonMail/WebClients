import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/index';
import { FileNameDisplay } from '@proton/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import { type useBookmarksPublicView } from '../../../store';
import { usePublicShareStore } from '../../../zustand/public/public-share.store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { SaveForLaterButton } from '../Bookmarks/SaveForLaterButton';
import DetailsButton from '../DetailsButton';
import { CreateButton } from '../EditActions/CreateButton';
import { UploadButton } from '../EditActions/UploadButton';
import Breadcrumbs from './Breadcrumbs';
import { DownloadButton, type DownloadButtonProps } from './DownloadButton';

import './SharedPageContentHeader.scss';

interface Props extends DownloadButtonProps {
    name: string;
    size?: number;
    bookmarksPublicView: ReturnType<typeof useBookmarksPublicView>;
    onNavigate?: (linkId: string) => void;
    className?: string;
    hideSaveToDrive?: boolean;
    isPartialView?: boolean;
    isFolderView?: boolean;
    token: string;
    linkId: string;
}

export function SharedPageContentHeader({
    token,
    linkId,
    name,
    size,
    rootLink,
    items,
    bookmarksPublicView,
    className,
    hideSaveToDrive,
    isPartialView,
    isFolderView = false,
    onNavigate,
}: Props) {
    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));
    const selectionControls = useSelection();
    const { isAlreadyBookmarked, addBookmark, isLoading, customPassword } = bookmarksPublicView;
    const readableSize = shortHumanSize(size);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const hasOnlyDocuments =
        (items.length > 0 && items.every((item) => item.isFile && isProtonDocument(item.mimeType))) ||
        (selectedItems.length > 0 && selectedItems.every((item) => item.isFile && isProtonDocument(item.mimeType)));

    return (
        <div className={clsx('flex lg:justify-space-between gap-4', className)}>
            <div className="flex flex-column flex-nowrap mb-0 pb-0 mr-4 max-w-full">
                <div className="flex md:flex-nowrap items-center pb-1 gap-2">
                    {isFolderView ? (
                        <Breadcrumbs
                            token={token}
                            name={name}
                            linkId={linkId}
                            onNavigate={onNavigate}
                            className="shared-folder-header-breadcrumbs"
                        />
                    ) : (
                        <FileNameDisplay className="text-4xl text-bold py-1 md:p-1" text={name} />
                    )}
                    {!viewOnly && <DetailsButton className="shrink-0 " linkId={linkId} />}
                </div>
                <div className="flex items-center color-weak">
                    {rootLink.signatureEmail && (
                        // translator: Text will be like: Shared by eric.norbert@pm.me
                        <>
                            <span>{c('Info').t`Shared by ${rootLink.signatureEmail}`}</span>
                            <i
                                className="mx-2 w-custom h-custom rounded-full bg-strong"
                                aria-hidden="true"
                                style={{
                                    '--w-custom': '0.25rem',
                                    '--h-custom': '0.25rem',
                                }}
                            />
                        </>
                    )}
                    {size !== undefined ? <span className="text-pre">{readableSize}</span> : <CircleLoader />}
                </div>
            </div>
            <div className="shared-page-content-header-buttons m-auto md:m-0 md:ml-auto">
                <DownloadButton rootLink={rootLink} items={items} disabled={hasOnlyDocuments || !items.length} />

                {isFolderView && !viewOnly && (
                    <>
                        <UploadButton token={token} linkId={linkId} />
                        <CreateButton token={token} linkId={linkId} />
                    </>
                )}
                {!hideSaveToDrive && !isPartialView && (
                    <SaveForLaterButton
                        loading={isLoading}
                        onClick={addBookmark}
                        alreadyBookmarked={isAlreadyBookmarked}
                        customPassword={customPassword}
                    />
                )}
            </div>
        </div>
    );
}
