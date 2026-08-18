import { useState } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PhoneInput from '@proton/components/components/v2/phone/LazyPhoneInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { useMyCountry } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { updateRecoveryPhoneValue } from '../../../../../recovery/accountRecoveryActions';
import type { ExtractRecoveryActionItem } from '../../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../../SafetyReviewCta';
import darkRecoveryPhoneIllustration from '../../../assets/recovery-phone-dark.svg';
import recoveryPhoneIllustration from '../../../assets/recovery-phone.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../../interface';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryPhone'>;
    onCompleted: () => void;
    onSkip: () => void;
};
export const UpdateRecoveryPhone = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [recoveryPhone, setRecoveryPhone] = useState(props.recoveryItem.recoveryItem.data.value);
    const dispatch = useDispatch();
    const defaultCountry = useMyCountry();
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
                        props.onCompleted();
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img
                        src={isDarkTheme ? darkRecoveryPhoneIllustration : recoveryPhoneIllustration}
                        alt=""
                        width={64}
                        height={64}
                    />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Update recovery phone`}</SafetyReviewCardHeader.Title>
            </SafetyReviewCardHeader>

            <InputFieldTwo
                label={c('label').t`Recovery phone number`}
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

            <p className="m-0 mt-2">{c('safety_review')
                .t`To make sure this number is really yours, we’ll send an SMS with a verification code.`}</p>

            <SafetyReviewCta {...props} onSkip={props.onSkip} loading={loading} cta={c('safety_review').t`Update`} />
        </form>
    );
};
