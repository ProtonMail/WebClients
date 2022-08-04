import * as React from 'react';

import { c } from 'ttag';

import { Button, Dropdown } from '@proton/components';
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
    const { getESDBStatus } = useSearchLibrary();
    const { isRefreshing, dbExists, isEnablingEncryptedSearch } = getESDBStatus();
    const showProgress = isEnablingEncryptedSearch || isRefreshing;
    const isESActive = dbExists && !isEnablingEncryptedSearch;

    return (
        <>
            <Dropdown
                anchorRef={anchorRef as React.RefObject<HTMLElement>}
                isOpen={isOpen}
                originalPlacement="bottom-left"
                autoClose={false}
                autoCloseOutside={true}
                noMaxSize
                onClose={onClose}
                onClosed={onClosed}
                className="dropdown-content--wide advanced-search-dropdown search-dropdown"
                disableDefaultArrowNavigation
                UNSTABLE_AUTO_HEIGHT
            >
                <div className="pl1-5 pr1-5 pt1-5 pb1">
                    <div>
                        <div className="flex">
                            <span className="inline-flex text-bold text-lg">
                                {isESActive ? c('Info').t`Search Enabled` : c('Info').t`Enabling drive search`}
                            </span>
                        </div>
                        <p className="mb0">
                            {isESActive
                                ? c('Info')
                                      .t`Private search enabled. You may now close this dialogue and search for files and folders.`
                                : c('Info')
                                      .t`To enable truly private search ${DRIVE_APP_NAME} needs to index your files locally. You can still use ${DRIVE_APP_NAME} normally - we’ll let you know when indexing is done.`}
                        </p>
                    </div>
                    {showProgress && <SearchIndexingProgress />}
                    <div className="flex flex-justify-end mt1">
                        <Button shape="ghost" color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
                    </div>
                </div>
            </Dropdown>
        </>
    );
};
