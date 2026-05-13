import { c } from 'ttag';

import ValidationError from '@proton/account/delegatedAccess/ValidationError';
import { addDelegatedAccessesThunk } from '@proton/account/delegatedAccess/outgoingActions';
import { AddContactInputs } from '@proton/account/delegatedAccess/shared/outgoing/AddContactInputs';
import { useAddContactInputs } from '@proton/account/delegatedAccess/shared/outgoing/useAddContactInputs';
import { useDispatch } from '@proton/account/delegatedAccess/useDispatch';
import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';
import noop from '@proton/utils/noop';

import darkIllustration from '../../assets/recovery-contacts-dark.svg';
import illustration from '../../assets/recovery-contacts.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'recoveryContacts'>;
};
export const AddRecoveryContacts = (props: Props) => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();

    const addContactInputs = useAddContactInputs();

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                addContactInputs.setSubmitted(true);
                if (addContactInputs.hasError || !onFormSubmit()) {
                    return;
                }
                withLoading(
                    (async function () {
                        const payload = addContactInputs.inputs.map((contact) => ({
                            targetEmail: contact.email,
                            triggerDelay: 0,
                            types: DelegatedAccessTypeEnum.SocialRecovery,
                        }));
                        try {
                            await dispatch(addDelegatedAccessesThunk({ contacts: payload }));
                            props.safetyReview.actions.next('completed', props.recoveryItem);
                        } catch (e) {
                            if (e instanceof ValidationError) {
                                addContactInputs.setAsyncError({ email: e.email, errorMessage: e.message });
                            } else {
                                handleError(e);
                            }
                        }
                    })()
                ).catch(noop);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={isDarkTheme ? darkIllustration : illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>
                    {c('safety_review').t`Allow trusted friends to unlock your data`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`Add people you trust and can contact easily. They will be able to help you unlock your data after you reset your password.`}
                </SafetyReviewCardHeader.Description>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review').t`They will not be able to see or access your data.`}
                </SafetyReviewCardHeader.Description>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review').t`They must already have a ${BRAND_NAME} Account.`}
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <h4 className="text-semibold text-rg m-0 mb-2">{c('safety_review').t`${BRAND_NAME} Account email`}</h4>
            <AddContactInputs
                type="recoveryContacts"
                addContactInputs={addContactInputs}
                loading={loading}
                validator={validator}
            />

            <SafetyReviewCta {...props} loading={loading} cta={c('safety_review').t`Add`} />
        </form>
    );
};
