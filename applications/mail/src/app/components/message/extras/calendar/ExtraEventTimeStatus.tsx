import { c } from 'ttag';

import { Banner } from '@proton/components';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';

import { EVENT_TIME_STATUS, InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: InvitationModel;
}

const ExtraEventTimeStatus = ({ model }: Props) => {
    const { timeStatus, hasMultipleVevents } = model;

    if (hasMultipleVevents || timeStatus === EVENT_TIME_STATUS.FUTURE) {
        return null;
    }
    const text =
        timeStatus === EVENT_TIME_STATUS.HAPPENING
            ? c('Calendar widget banner').t`Event in progress`
            : c('Calendar widget banner').t`Event already ended`;
    return <Banner backgroundColor={BannerBackgroundColor.WARNING}>{text}</Banner>;
};

export default ExtraEventTimeStatus;
