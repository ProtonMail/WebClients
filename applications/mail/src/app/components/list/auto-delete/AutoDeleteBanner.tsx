import { isAllowedAutoDeleteLabelID } from '../../../helpers/autoDelete';
import { showLabelTaskRunningBanner } from '../../../logic/elements/elementsSelectors';
import { useAppSelector } from '../../../logic/store';
import useAutoDeleteBanner from './useAutodeleteBanner';
import AutoDeleteEnabledBanner from './variations/AutoDeleteEnabledBanner';
import AutoDeleteFreeBanner from './variations/AutoDeleteFreeBanner';
import AutoDeletePaidBanner from './variations/AutoDeletePaidBanner';

interface Props {
    labelID: string;
}

const AutoDeleteBanner = ({ labelID }: Props) => {
    const bannerType = useAutoDeleteBanner(labelID);
    const avoidBannersUIStacking = useAppSelector(showLabelTaskRunningBanner);

    if (avoidBannersUIStacking || !isAllowedAutoDeleteLabelID(labelID) || ['hide', 'disabled'].includes(bannerType)) {
        return null;
    }

    return (
        <div data-testid="auto-delete:banner">
            {bannerType === 'free-banner' && <AutoDeleteFreeBanner labelID={labelID} />}
            {bannerType === 'paid-banner' && <AutoDeletePaidBanner labelID={labelID} />}
            {bannerType === 'enabled' && <AutoDeleteEnabledBanner labelID={labelID} />}
        </div>
    );
};

export default AutoDeleteBanner;
