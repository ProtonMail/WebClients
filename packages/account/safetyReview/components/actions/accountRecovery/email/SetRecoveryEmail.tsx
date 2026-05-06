import { useState } from 'react';

import { c } from 'ttag';

import { updateRecoveryEmailValue } from '@proton/account/recovery/accountRecoveryActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import { SafetyReviewCardHeader } from '@proton/account/safetyReview/components/cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import recoveryEmailIllustration from '../../../assets/recovery-email.svg';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'setRecoveryEmail'>;
};
export const SetRecoveryEmail = (props: Props) => {
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const dispatch = useDispatch();
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [loading, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(
                    (async function () {
                        await dispatch(updateRecoveryEmailValue({ value: recoveryEmail, persistPasswordScope: true }));
                        sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={recoveryEmailIllustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review').t`Add recovery email`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You can use your recovery email to regain access to your account if you forget your password.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <InputFieldTwo
                label={c('Label').t`Recovery email address`}
                disableChange={loading}
                type="email"
                autoComplete="email"
                autoFocus
                bigger
                id="recovery-email-input"
                value={recoveryEmail}
                onValue={setRecoveryEmail}
                error={validator([requiredValidator(recoveryEmail), emailValidator(recoveryEmail)])}
            />

            <p className="m-0 mt-2">{c('safety_review')
                .t`To make sure this address is really yours, we’ll send an email with a verification link.`}</p>

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Add`} />
        </form>
    );
};
