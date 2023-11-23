import { c } from 'ttag';

import { Banner } from '@proton/components';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getIsVeventCancelled } from '@proton/shared/lib/calendar/vcalHelper';
import { RequireSome } from '@proton/shared/lib/interfaces';

import { EVENT_TIME_STATUS, InvitationModel } from '../../../../helpers/calendar/invite';

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
    return <Banner backgroundColor={BannerBackgroundColor.WARNING}>{text}</Banner>;
};

export default ExtraEventTimeStatus;
