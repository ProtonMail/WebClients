import { useState } from 'react';

import { c } from 'ttag';

import { updateRecoveryPhoneValue } from '@proton/account/recovery/accountRecoveryActions';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/LazyPhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import { useMyCountry } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import recoveryPhoneIllustration from '../../../assets/recovery-phone.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'setRecoveryPhone'>;
};
export const SetRecoveryPhone = (props: Props) => {
    const [recoveryPhone, setRecoveryPhone] = useState('');
    const dispatch = useDispatch();
    const defaultCountry = useMyCountry();
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
                        await dispatch(updateRecoveryPhoneValue({ value: recoveryPhone, persistPasswordScope: true }));
                        sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
                        props.safetyReview.actions.next('completed', props.recoveryItem);
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={recoveryPhoneIllustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review').t`Add phone number`}</SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`You can use your recovery phone to regain access to your account if you forget your password.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <InputFieldTwo
                label={c('label').t`Set recovery phone number`}
                disableChange={loading}
                as={PhoneInput}
                id="recovery-phone-input"
                autoFocus
                bigger
                defaultCountry={defaultCountry}
                value={recoveryPhone}
                onChange={setRecoveryPhone}
                error={validator([requiredValidator(recoveryPhone)])}
            />
            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Add`} />
        </form>
    );
};
