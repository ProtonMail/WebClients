import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { DriveEmptyView } from '../../../components/layout/DriveEmptyView';

export const EnableSearchView = ({
    enableSearch,
    isComputingSearchIndex,
}: {
    enableSearch: () => void;
    isComputingSearchIndex: boolean;
}) => {
    // translator: Shown when searching and search is not enabled yet
    const title = c('Title').t`Enable drive search`;
    // translator: Shown when searching and search is not enabled yet
    const subtitle = c('Info').t`To enable truly private search ${DRIVE_APP_NAME} needs to index your files locally.`;

    return (
        <DriveEmptyView image={noResultSearchSvg} title={title} subtitle={subtitle}>
            <div className="flex justify-center">
                <Button
                    color="norm"
                    size="large"
                    className="text-bold"
                    onClick={enableSearch}
                    loading={isComputingSearchIndex}
                    disabled={isComputingSearchIndex}
                >
                    {c('Action').t`Enable drive search`}
                </Button>
            </div>
        </DriveEmptyView>
    );
};
