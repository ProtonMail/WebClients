import { c } from 'ttag';

import { DeprecatedBanner, DeprecatedBannerBackgroundColor } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getIsVeventCancelled } from '@proton/shared/lib/calendar/vcalHelper';
import type { RequireSome } from '@proton/shared/lib/interfaces';

import type { InvitationModel } from '../../../../helpers/calendar/invite';
import { EVENT_TIME_STATUS } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}

const ExtraEventTimeStatus = ({ model }: Props) => {
    const { timeStatus, hasMultipleVevents, invitationIcs, isOutdated, invitationApi } = model;

    if (
        hasMultipleVevents ||
        timeStatus === EVENT_TIME_STATUS.FUTURE ||
        invitationIcs.method === ICAL_METHOD.CANCEL ||
        (isOutdated && invitationApi && getIsVeventCancelled(invitationApi.vevent))
    ) {
        return null;
    }

    const text =
        timeStatus === EVENT_TIME_STATUS.HAPPENING
            ? c('Calendar widget banner').t`Event in progress`
            : c('Calendar widget banner').t`Event already ended`;
    return <DeprecatedBanner backgroundColor={DeprecatedBannerBackgroundColor.WARNING}>{text}</DeprecatedBanner>;
};

export default ExtraEventTimeStatus;
