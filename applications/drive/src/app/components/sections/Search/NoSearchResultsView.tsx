import { c } from 'ttag';

import { EmptyViewContainer, PrimaryButton } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { useSearchControl } from '../../../store';

export const NoSearchResultsView = () => {
    const { prepareSearchData, hasData, isBuilding } = useSearchControl();

    if (!hasData || isBuilding) {
        return (
            <EmptyViewContainer imageProps={{ src: noResultSearchSvg, alt: c('Info').t`Enable drive search` }}>
                <h3 className="text-bold">{c('Title').t`Enable drive search`}</h3>
                <p>{c('Info')
                    .t`To enable truly private search ${DRIVE_APP_NAME} needs to index your files locally.`}</p>
                <div className="flex flex-justify-center">
                    <PrimaryButton
                        size="large"
                        className="text-bold"
                        onClick={() => prepareSearchData()}
                        loading={isBuilding}
                        disabled={isBuilding || hasData}
                    >
                        {c('Action').t`Enable drive search`}
                    </PrimaryButton>
                </div>
            </EmptyViewContainer>
        );
    }

    return (
        <EmptyViewContainer imageProps={{ src: noResultSearchSvg, alt: c('Info').t`No results found` }}>
            <h3 className="text-bold">{c('Title').t`No results found`}</h3>
            <p data-if="folder">{c('Info').t`Try different keywords`}</p>
        </EmptyViewContainer>
    );
};
