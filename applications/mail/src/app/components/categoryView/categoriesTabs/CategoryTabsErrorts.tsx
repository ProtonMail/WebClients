import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

export const CategoryTabError = () => {
    return (
        <div className="tab-container flex flex-nowrap items-center text-no-decoration color-hint border border-transparent">
            <Icon name="circle-slash" className="shrink-0" />
            <span className="tag-label tag-label-text">{c('Error message').t`Something went wrong`}</span>
        </div>
    );
};

export const CategoriesTabsError = () => {
    return (
        <div className="categories-tabs flex flex-row flex-nowrap px-4 h-fit-content border-bottom border-weak">
            <div className="tab-container flex flex-nowrap items-center text-no-decoration color-hint border border-transparent">
                <span>{c('Error message').t`An error occured with the categories`}</span>
                <Button size="small" shape="ghost" className="color-weak" onClick={() => window.location.reload()}>
                    <Icon name="arrow-rotate-right" />
                    <span className="ml-4">{c('Action').t`Refresh the page`}</span>
                </Button>
            </div>
        </div>
    );
};
