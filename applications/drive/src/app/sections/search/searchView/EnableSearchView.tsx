import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { DriveEmptyView } from '../../../components/layout/DriveEmptyView';
import type { IndexingProgress } from '../../../modules/search';
import { formatIndexingProgress, hasIndexedAnything } from '../formatIndexingProgress';

export const EnableSearchView = ({
    optIn,
    isIndexingInProgress,
    indexingProgress,
}: {
    optIn: () => void;
    isIndexingInProgress: boolean;
    indexingProgress: IndexingProgress;
}) => {
    // translator: Shown when searching and search is not enabled yet
    const title = c('Title').t`Enable drive search`;
    // translator: Shown when searching and search is not enabled yet
    const subtitle = c('Info').t`To enable truly private search ${DRIVE_APP_NAME} needs to index your files locally.`;

    // Show live progress only while indexing is actually running and has produced counts.
    const showProgress = isIndexingInProgress && hasIndexedAnything(indexingProgress);

    return (
        <DriveEmptyView image={noResultSearchSvg} title={title} subtitle={subtitle}>
            <div className="flex flex-column items-center gap-2">
                <Button
                    color="norm"
                    size="large"
                    className="text-bold"
                    onClick={optIn}
                    loading={isIndexingInProgress}
                    disabled={isIndexingInProgress}
                >
                    {c('Action').t`Enable drive search`}
                </Button>
                {showProgress && (
                    <p aria-live="polite" aria-atomic="true" className="mb-0 color-weak">
                        {formatIndexingProgress(indexingProgress, false)}
                    </p>
                )}
            </div>
        </DriveEmptyView>
    );
};
