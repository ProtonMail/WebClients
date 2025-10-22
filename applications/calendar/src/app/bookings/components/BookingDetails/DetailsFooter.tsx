import { c } from 'ttag';

import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { RedirectToCalendar } from '../RedirectToCalendar';

export const DetailsFooter = () => {
    return (
        <div className="mt-6 text-center">
            <p className="color-weak m-0">{c('Info').t`Want to create your own booking page?`}</p>
            <RedirectToCalendar shape="underline" color="norm" className="p-0">{c('Action')
                .t`Join ${CALENDAR_APP_NAME}`}</RedirectToCalendar>
        </div>
    );
};
