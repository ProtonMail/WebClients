import { c } from 'ttag';

import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import SentinelShield from './SentinelShield.svg';

const SentinelBanner = () => {
    return (
        <section className="rounded-xl bg-elevated p-4 shadow-norm flex items-center gap-4">
            <div className="shrink-0">
                <img src={SentinelShield} alt="" width={40} height={48} />
            </div>

            <div className="min-w-0 flex-1">
                <h2 className="m-0 mb-1 text-semibold text-rg">
                    {c('Sentinel banner').t`You have recommended actions from ${PROTON_SENTINEL_NAME}`}
                </h2>
                <p className="m-0 text-sm">
                    {c('Sentinel banner')
                        .t`To ensure the highest possible security of your account, download your recovery phrase and disable the highlighted options.`}
                </p>
            </div>
        </section>
    );
};

export default SentinelBanner;
