import { c } from 'ttag';

import { Toggle } from '@proton/components/components';
import ProtonSentinelPlusLogo from '@proton/styles/assets/img/illustrations/proton-sentinel-shield-plus.svg';

interface Props {
    onToggleBreaches: () => void;
}

const FreeUserNoBreaches = ({ onToggleBreaches }: Props) => {
    return (
        <div className="w-full flex *:min-size-auto flex-column gap-2 shrink-0 justify-center px-4 py-2 rounded-lg border border-norm">
            <div className="flex flex-nowrap items-center gap-2 mt-2">
                <div className="shrink-0 flex">
                    <img src={ProtonSentinelPlusLogo} alt="" />
                </div>
                <h3 className="flex-1 text-rg">
                    <label htmlFor="breaches-toggle">{c('Info').t`Breach alerts`}</label>
                </h3>
                <Toggle id="breaches-toggle" onChange={onToggleBreaches} className="shrink-0" />
            </div>
            <p className="mt-1 mb-2 text-sm color-weak">
                {c('Security Center - Info').t`Get notified if your password or other personal data was leaked.`}
            </p>
        </div>
    );
};

export default FreeUserNoBreaches;
