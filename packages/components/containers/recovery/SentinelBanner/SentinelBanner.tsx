import { c } from 'ttag';

import { selectSentinelRecoveryBannerDisplay } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import SentinelShield from './SentinelShield.svg';

const SentinelBanner = () => {
    const { loading, variant } = useSelector(selectSentinelRecoveryBannerDisplay);

    if (loading || variant === null) {
        return null;
    }

    const description =
        variant === 'disable-recovery-options'
            ? c('Sentinel banner')
                  .t`To ensure the highest possible security of your account, disable the highlighted options.`
            : c('Sentinel banner')
                  .t`To make sure that you can always access your ${BRAND_NAME} Account, download your recovery phrase.`;

    return (
        <section className="rounded-xl bg-elevated p-4 shadow-norm flex items-center gap-4">
            <div className="shrink-0">
                <img src={SentinelShield} alt="" width={56} height={56} />
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
