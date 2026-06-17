import { c } from 'ttag';

import { selectSentinelRecoveryBannerDisplay } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import SentinelShieldDark from './SentinelShield-dark.svg';
import SentinelShield from './SentinelShield.svg';

interface Props {
    variant: SettingsLayoutVariant;
}
const SentinelBanner = ({ variant: layoutVariant }: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const { loading, variant } = useSelector(selectSentinelRecoveryBannerDisplay);

    if (loading || variant === null) {
        return null;
    }

    const description =
        variant === 'disable-recovery-options'
            ? c('Sentinel banner')
                  .t`To ensure the highest possible security of your account, disable recovery via email and SMS.`
            : c('Sentinel banner')
                  .t`To make sure that you can always access your ${BRAND_NAME} Account, download your recovery phrase.`;

    return (
        <section
            className={clsx(
                'rounded-xl bg-elevated p-4 flex items-center gap-4',
                layoutVariant !== SettingsLayoutVariant.Mobile && 'shadow-norm'
            )}
        >
            <div className="shrink-0">
                <img src={isDarkTheme ? SentinelShieldDark : SentinelShield} alt="" width={56} height={56} />
            </div>

            <div className="min-w-0 flex-1">
                <h2 className="m-0 mb-1 text-semibold text-rg">
                    {c('Sentinel banner').t`You have recommended actions from ${PROTON_SENTINEL_NAME}`}
                </h2>
                <p className="m-0 text-sm">{description}</p>
            </div>
        </section>
    );
};

export default SentinelBanner;
