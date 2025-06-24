import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { useSearchControl } from '../../../store';
import { DriveEmptyView } from '../../layout/DriveEmptyView';

const getTitle = (isReady: boolean) => {
    if (isReady) {
        // translator: Shown when searching and no results are found
        return c('Title').t`No results found`;
    }

    // translator: Shown when searching and search is not enabled yet
    return c('Title').t`Enable drive search`;
};

const getSubtitles = (isReady: boolean) => {
    if (isReady) {
        return [
            // translator: Shown when searching and no results are found
            c('Info').t`Try searching by file name, date, or type.`,
            // translator: Shown when searching and no results are found
            c('Info').t`Also try looking in Trash.`,
        ];
    }

    // translator: Shown when searching and search is not enabled yet
    return c('Info').t`To enable truly private search ${DRIVE_APP_NAME} needs to index your files locally.`;
};

type Props = {};

export const NoSearchResultsView: FC<Props> = () => {
    const { prepareSearchData, hasData, isEnablingEncryptedSearch } = useSearchControl();

    const isReady = hasData && !isEnablingEncryptedSearch;

    return (
        <DriveEmptyView image={noResultSearchSvg} title={getTitle(isReady)} subtitle={getSubtitles(isReady)}>
            {!isReady && (
                <div className="flex justify-center">
                    <Button
                        color="norm"
                        size="large"
                        className="text-bold"
                        onClick={() => prepareSearchData()}
                        loading={isEnablingEncryptedSearch}
                        disabled={isEnablingEncryptedSearch || hasData}
                    >
                        {c('Action').t`Enable drive search`}
                    </Button>
                </div>
            )}
        </DriveEmptyView>
    );
};
