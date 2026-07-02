import { c } from 'ttag';

export const TabNewCount = () => {
    return (
        <span className="tab-new-count text-semibold mail-category-color" aria-hidden="true">
            {c('Info').t`New messages`}
        </span>
    );
};
