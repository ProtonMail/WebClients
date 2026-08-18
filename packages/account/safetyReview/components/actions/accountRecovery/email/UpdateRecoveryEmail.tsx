import { useState } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { updateRecoveryEmailValue } from '../../../../../recovery/accountRecoveryActions';
import type { ExtractRecoveryActionItem } from '../../../../recoveryState/recoveryState';
import { SafetyReviewCta } from '../../../SafetyReviewCta';
import darkRecoveryEmailIllustration from '../../../assets/recovery-email-dark.svg';
import recoveryEmailIllustration from '../../../assets/recovery-email.svg';
import { SafetyReviewCardHeader } from '../../../cards/SafetyReviewCardHeader';
import type { SafetyReviewAllProps } from '../../../interface';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'verifyRecoveryEmail'>;
    onCompleted: () => void;
    onSkip: () => void;
};
export const UpdateRecoveryEmail = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [recoveryEmail, setRecoveryEmail] = useState(props.recoveryItem.recoveryItem.data.value);
    const dispatch = useDispatch();
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
                        props.onCompleted();
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img
                        src={isDarkTheme ? darkRecoveryEmailIllustration : recoveryEmailIllustration}
                        alt=""
                        width={64}
                        height={64}
                    />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>{c('safety_review')
                    .t`Update recovery email`}</SafetyReviewCardHeader.Title>
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
                .t`To make sure this address is really yours, we’ll send an email with a verification code.`}</p>

            <SafetyReviewCta {...props} onSkip={props.onSkip} loading={loading} cta={c('safety_review').t`Update`} />
        </form>
    );
};
