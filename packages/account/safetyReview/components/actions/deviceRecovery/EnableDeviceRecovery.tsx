import { c } from 'ttag';

import { updateDeviceRecoverySettingsThunk } from '@proton/account/recovery/deviceRecovery';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import illustration from '../../assets/device-based-recovery.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'deviceRecovery'>;
};

export const EnableDeviceRecovery = (props: Props) => {
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                withLoading(
                    (async function () {
                        if (await dispatch(updateDeviceRecoverySettingsThunk({ deviceRecovery: true }))) {
                            sendRecoverySettingEnabled({ setting: 'device_recovery' });
                        }
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Allow data recovery from this device`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You can save a data backup on this device. This will restore access to emails, contacts, files, passwords, and any other encrypted data on your account after a password reset, simply by signing in on this device.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Allow`} />
        </form>
    );
};
