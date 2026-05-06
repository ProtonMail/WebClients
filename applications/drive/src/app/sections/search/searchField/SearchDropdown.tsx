import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownSizeUnit } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { tryCatchWithNotification } from '../../../modules/search';
import type { IndexingProgress } from '../../../modules/search';
import type { PermanentErrorKind } from '../../../modules/search/internal/shared/errors';
import { formatIndexingProgress } from '../formatIndexingProgress';

interface Props {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    onClosed: () => void;
    isSearchable: boolean;
    isInitialIndexing: boolean;
    isRunningOutdatedAppVersion: boolean;
    indexingProgress: IndexingProgress;
    permanentError: PermanentErrorKind | null;
    rebuild: () => Promise<void>;
}

export function SearchDropdown({
    isOpen,
    anchorRef,
    onClose,
    onClosed,
    isSearchable,
    isInitialIndexing,
    isRunningOutdatedAppVersion,
    indexingProgress,
    permanentError,
    rebuild,
}: Props) {
    const showProgress = isInitialIndexing;
    const isSearchReady = isSearchable && !isInitialIndexing;

    const renderContent = () => {
        /** TODO: Add tracking for these states */
        if (permanentError) {
            return (
                <PermanentErrorContent
                    kind={permanentError}
                    onRebuild={() => {
                        void tryCatchWithNotification(rebuild)();
                    }}
                    onClose={onClose}
                />
            );
        }
        if (isRunningOutdatedAppVersion) {
            return <OutdatedAppVersionContent />;
        }
        return (
            <Content
                isSearchReady={isSearchReady}
                showProgress={showProgress}
                indexingProgress={indexingProgress}
                onClose={onClose}
            />
        );
    };

    return (
        <Dropdown
            anchorRef={anchorRef as React.RefObject<HTMLElement>}
            isOpen={isOpen}
            originalPlacement="bottom-start"
            autoClose={false}
            autoCloseOutside={true}
            size={{
                height: DropdownSizeUnit.Dynamic,
                maxWidth: DropdownSizeUnit.Viewport,
                maxHeight: DropdownSizeUnit.Viewport,
            }}
            onClose={onClose}
            onClosed={onClosed}
            className="dropdown-content--wide advanced-search-dropdown min-w-custom max-w-custom"
            style={{ '--min-w-custom': '35em', '--max-w-custom': '35em' }}
            disableDefaultArrowNavigation
        >
            {renderContent()}
        </Dropdown>
    );
}

interface ContentProps {
    isSearchReady: boolean;
    showProgress: boolean;
    indexingProgress: IndexingProgress;
    onClose: () => void;
}

function Content({ isSearchReady, showProgress, indexingProgress, onClose }: ContentProps) {
    return (
        <div className="px-5 pt-5 pb-4">
            <div>
                <div className="flex">
                    <span className="inline-flex text-bold text-lg">
                        {isSearchReady ? c('Info').t`Search Enabled` : c('Info').t`Enabling drive search`}
                    </span>
                </div>
                <p className="mb-0">
                    {isSearchReady
                        ? c('Info').t`Search enabled. You may now close this dialogue and search for files and folders.`
                        : c('Info')
                              .t`To enable truly search, we need to index your files locally. You can still use ${DRIVE_APP_NAME} normally - we'll let you know when indexing is done.`}
                </p>
            </div>
            {showProgress && <IndexingProgressInfo progress={indexingProgress} isComplete={false} />}
            {isSearchReady && <IndexingProgressInfo progress={indexingProgress} isComplete={true} />}
            <div className="flex justify-end mt-4">
                <Button shape="ghost" color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </div>
        </div>
    );
}

function PermanentErrorContent({
    kind,
    onRebuild,
    onClose,
}: {
    kind: PermanentErrorKind;
    onRebuild: () => void;
    onClose: () => void;
}) {
    const { title, message } = getPermanentErrorCopy(kind);
    return (
        <div className="px-5 pt-5 pb-4">
            <div>
                <div className="flex">
                    <span className="inline-flex text-bold text-lg">{title}</span>
                </div>
                <p className="mb-0">{message}</p>
            </div>
            <div className="flex justify-end mt-4 gap-2">
                <Button shape="ghost" color="weak" onClick={onClose}>{c('Action').t`Dismiss`}</Button>
                <Button shape="solid" color="norm" onClick={onRebuild}>{c('Action').t`Rebuild index`}</Button>
            </div>
        </div>
    );
}

function getPermanentErrorCopy(kind: PermanentErrorKind): { title: string; message: string } {
    switch (kind) {
        case 'quota_exceeded':
            return {
                title: c('Info').t`Not enough storage space`,
                message: c('Info')
                    .t`Your browser ran out of space while indexing files for search. Free up storage, then rebuild the index.`,
            };
        case 'corrupted_db':
            return {
                title: c('Info').t`Search data is corrupted`,
                message: c('Info')
                    .t`${DRIVE_APP_NAME} detected that the local search index is corrupted and can no longer be used. Rebuild the index to restore search.`,
            };
        case 'invalid_indexer_state':
            return {
                title: c('Info').t`Search is in an invalid state`,
                message: c('Info')
                    .t`Indexing hit an unexpected state and cannot continue. Rebuild the index to recover.`,
            };
        case 'search_library_error':
            return {
                title: c('Info').t`Search engine error`,
                message: c('Info').t`The search engine encountered an internal error. Rebuild the index to recover.`,
            };
        default:
            return {
                title: c('Info').t`Search error`,
                message: c('Info').t`Search encountered an internal error. Rebuild the index to recover.`,
            };
    }
}

function OutdatedAppVersionContent() {
    return (
        <div className="px-5 pt-5 pb-4">
            <div>
                <div className="flex">
                    <span className="inline-flex text-bold text-lg">{c('Info').t`Update required`}</span>
                </div>
                <p className="mb-0">
                    {c('Info')
                        .t`A new version of ${DRIVE_APP_NAME} is available. Please reload to continue using search.`}
                </p>
            </div>
            <div className="flex justify-end mt-4">
                <Button shape="ghost" color="norm" onClick={() => window.location.reload()}>{c('Action')
                    .t`Reload`}</Button>
            </div>
        </div>
    );
}

function IndexingProgressInfo({ progress, isComplete }: { progress: IndexingProgress; isComplete: boolean }) {
    const message = formatIndexingProgress(progress, isComplete);
    if (message === null) {
        return null;
    }
    return (
        <p aria-live="polite" className="mb-0 color-weak">
            {message}
        </p>
    );
}
