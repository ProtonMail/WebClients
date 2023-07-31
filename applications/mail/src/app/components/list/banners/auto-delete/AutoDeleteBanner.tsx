import { AutoDeleteBannerType } from './useAutodeleteBanner';
import AutoDeleteEnabledBanner from './variations/AutoDeleteEnabledBanner';
import AutoDeleteFreeBanner from './variations/AutoDeleteFreeBanner';
import AutoDeletePaidBanner from './variations/AutoDeletePaidBanner';

interface Props {
    columnLayout?: boolean;
    isCompactView?: boolean;
    bannerType: AutoDeleteBannerType;
}

const AutoDeleteBanner = ({ bannerType, columnLayout = false, isCompactView = false }: Props) => {
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
