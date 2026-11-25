import { c } from 'ttag';

import emptySearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

export const NoEventsInfo = () => {
    return (
        <div className="flex flex-column items-center mt-3">
            <img alt={c('Title').t`No events`} src={emptySearchSvg} width={200} height={200} />
            <span className="text-semibold">{c('Title').t`There are no events yet for your organization.`}</span>
        </div>
    );
};
