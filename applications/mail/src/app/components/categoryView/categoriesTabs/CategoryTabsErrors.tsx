import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';

export const CategoryTabError = () => {
    return (
        <div className="tab-error flex flex-nowrap items-center gap-2 color-hint">
            <IcCircleSlash className="shrink-0" />
            <span className="text-sm text-ellipsis min-w-0">{c('Error message').t`Something went wrong`}</span>
        </div>
    );
};

export const CategoriesTabsError = () => {
    return (
        <div className="categories-tabs flex flex-row flex-nowrap px-4 h-fit-content border-bottom border-weak">
            <div className="tab-error flex flex-nowrap items-center gap-2 color-hint">
                <span>{c('Error message').t`An error occurred with the categories`}</span>
                <Button size="small" shape="ghost" className="color-weak" onClick={() => window.location.reload()}>
                    <IcArrowRotateRight />
                    <span className="ml-4">{c('Action').t`Refresh the page`}</span>
                </Button>
            </div>
        </div>
    );
};
