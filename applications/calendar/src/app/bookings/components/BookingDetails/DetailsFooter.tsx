import { c } from 'ttag';

import { RedirectToCalendarButton } from '../RedirectToCalendar';

export const DetailsFooter = () => {
    return (
        <div className="mt-6 text-center">
            <p className="color-weak m-0">{c('Info').t`Want to create your own booking page?`}</p>
            <RedirectToCalendarButton shape="underline" color="norm" className="p-0" />
        </div>
    );
};
