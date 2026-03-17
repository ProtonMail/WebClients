import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownSizeUnit } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    onClosed: () => void;
    isSearchable: boolean;
    isInitialIndexing: boolean;
    isRunningOutdatedAppVersion: boolean;
}

const Content = ({
    isSearchReady,
    showProgress,
    onClose,
}: {
    isSearchReady: boolean;
    showProgress: boolean;
    onClose: () => void;
}) => {
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
            {/* TODO: Show nicer progress  */}
            {showProgress && <p aria-live="polite">{c('Info').t`Indexing in progress`}&hellip;</p>}
            <div className="flex justify-end mt-4">
                <Button shape="ghost" color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </div>
        </div>
    );
};

const OutdatedAppVersionContent = () => {
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
};

export const SearchDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onClosed,
    isSearchable,
    isInitialIndexing,
    isRunningOutdatedAppVersion,
}: Props) => {
    const showProgress = isInitialIndexing;
    const isSearchReady = isSearchable && !isInitialIndexing;
    return (
        <>
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
                {/* TODO: Add tracking for these states */}
                {isRunningOutdatedAppVersion ? (
                    <OutdatedAppVersionContent />
                ) : (
                    <Content isSearchReady={isSearchReady} showProgress={showProgress} onClose={onClose} />
                )}
            </Dropdown>
        </>
    );
};
