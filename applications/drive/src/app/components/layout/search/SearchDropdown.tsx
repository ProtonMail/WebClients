import * as React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownSizeUnit } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useSearchLibrary } from '../../../store';
import { SearchIndexingProgress } from './SearchIndexingProgress';

import './SearchDropdown.scss';

interface Props {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
    onClose: (e: any) => void;
    onClosed: () => void;
}

export const SearchDropdown = ({ isOpen, anchorRef, onClose, onClosed }: Props) => {
    const { esStatus } = useSearchLibrary();
    const { isRefreshing, dbExists, isEnablingEncryptedSearch } = esStatus;
    const showProgress = isEnablingEncryptedSearch || isRefreshing;
    const isESActive = dbExists && !isEnablingEncryptedSearch;

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
                className="dropdown-content--wide advanced-search-dropdown search-dropdown"
                disableDefaultArrowNavigation
            >
                <div className="px-5 pt-5 pb-4">
                    <div>
                        <div className="flex">
                            <span className="inline-flex text-bold text-lg">
                                {isESActive ? c('Info').t`Search Enabled` : c('Info').t`Enabling drive search`}
                            </span>
                        </div>
                        <p className="mb-0">
                            {isESActive
                                ? c('Info')
                                      .t`Private search enabled. You may now close this dialogue and search for files and folders.`
                                : c('Info')
                                      .t`To enable truly private search, we need to index your files locally. You can still use ${DRIVE_APP_NAME} normally - we’ll let you know when indexing is done.`}
                        </p>
                    </div>
                    {showProgress && <SearchIndexingProgress />}
                    <div className="flex justify-end mt-4">
                        <Button shape="ghost" color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
                    </div>
                </div>
            </Dropdown>
        </>
    );
};
