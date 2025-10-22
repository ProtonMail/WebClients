import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { CalendarLogo } from '@proton/components/index';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

export const BookingsHeader = () => {
    return (
        <div className="border-bottom flex items-center justify-space-between px-4 py-3 w-full">
            <CalendarLogo />
            <ButtonLike as={Href} href="/signup" target="_self">{c('Action').t`Join ${CALENDAR_APP_NAME}`}</ButtonLike>
        </div>
    );
};
