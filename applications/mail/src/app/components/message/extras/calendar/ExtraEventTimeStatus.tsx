import { Banner } from '@proton/components';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { c } from 'ttag';
import { EVENT_TIME_STATUS } from '../../../../helpers/calendar/invite';

interface Props {
    timeStatus: EVENT_TIME_STATUS;
}

const ExtraEventTimeStatus = ({ timeStatus }: Props) => {
    if (timeStatus === EVENT_TIME_STATUS.FUTURE) {
        return null;
    }
    const text = timeStatus === EVENT_TIME_STATUS.HAPPENING
        ? c('Calendar widget banner').t`Event in progress`
        : c('Calendar widget banner').t`Event already ended`
    return (
        <Banner backgroundColor={BannerBackgroundColor.WARNING} >
            {text}
        </Banner>
    );
};

export default ExtraEventTimeStatus;
