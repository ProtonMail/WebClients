import { isAllowedAutoDeleteLabelID } from '../../../helpers/autoDelete';
import { showLabelTaskRunningBanner } from '../../../logic/elements/elementsSelectors';
import { useAppSelector } from '../../../logic/store';
import useAutoDeleteBanner from './useAutodeleteBanner';
import AutoDeleteEnabledBanner from './variations/AutoDeleteEnabledBanner';
import AutoDeleteFreeBanner from './variations/AutoDeleteFreeBanner';
import AutoDeletePaidBanner from './variations/AutoDeletePaidBanner';

interface Props {
    labelID: string;
    columnLayout?: boolean;
    isCompactView?: boolean;
}

const AutoDeleteBanner = ({ labelID, columnLayout = false, isCompactView = false }: Props) => {
    const bannerType = useAutoDeleteBanner(labelID);
    const avoidBannersUIStacking = useAppSelector(showLabelTaskRunningBanner);

    if (avoidBannersUIStacking || !isAllowedAutoDeleteLabelID(labelID) || ['hide', 'disabled'].includes(bannerType)) {
        return null;
    }

    return (
        <div data-testid="auto-delete:banner">
            {bannerType === 'free-banner' && <AutoDeleteFreeBanner />}
            {bannerType === 'paid-banner' && <AutoDeletePaidBanner />}
            {bannerType === 'enabled' && (
                <AutoDeleteEnabledBanner columnLayout={columnLayout} isCompactView={isCompactView} />
            )}
        </div>
    );
};

export default AutoDeleteBanner;
