import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import Toggle from '@proton/components/components/toggle/Toggle';
import sentinel from '@proton/pass/assets/monitor/sentinel.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { sentinelToggle } from '@proton/pass/store/actions';
import { selectPassPlan, selectSentinelEligible, selectSentinelEnabled } from '@proton/pass/store/selectors';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

type Props = { onUpsell: () => void };

export const Sentinel: FC<Props> = ({ onUpsell }) => {
    const { onLink } = usePassCore();

    const sentinelUpdate = useActionRequest(sentinelToggle.intent);
    const sentinelEnabled = useSelector(selectSentinelEnabled);
    const passPlan = useSelector(selectPassPlan);
    const isSentinelEligible = useSelector(selectSentinelEligible);

    const toggleSentinel = () => {
        const value = SETTINGS_PROTON_SENTINEL_STATE[sentinelEnabled ? 'DISABLED' : 'ENABLED'];
        if (isPaidPlan(passPlan) && isSentinelEligible) sentinelUpdate.dispatch(value);
        else onUpsell();
    };
    const learnMoreLink = (
        <InlineLinkButton
            onClick={() => onLink('https://proton.me/support/proton-sentinel')}
            key="leran-more-sentinel"
        >{c('Action').t`Learn more`}</InlineLinkButton>
    );

    return (
        <CardContent
            className="p-6 bg-weak rounded-xl border border-norm"
            title={PROTON_SENTINEL_NAME}
            titleClassname="text-lg text-bold mb-1"
            subtitle={
                // translator: This is at Sentinel Pass monitoring options, full text is: Our cutting-edge AI-driven security solution designed for users seeking heightened protection for their accounts. Learn more
                c('Description')
                    .jt`Our cutting-edge AI-driven security solution designed for users seeking heightened protection for their accounts. ${learnMoreLink}`
            }
            subtitleClassname="color-norm-major"
            icon={() => <img src={sentinel} alt="" />}
            actions={
                <Toggle
                    id="toggle-sentinel"
                    checked={sentinelEnabled}
                    onChange={toggleSentinel}
                    className="self-center"
                    loading={sentinelUpdate.loading}
                />
            }
        />
    );
};
