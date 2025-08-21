import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalTwoPromiseHandlers } from '@proton/components/components/modalTwo/useModalTwo';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useConfig from '@proton/components/hooks/useConfig';
import { type FeedbackDowngradeData } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import shuffle from '@proton/utils/shuffle';

import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';

export enum SUBSCRIPTION_CANCELLATION_REASONS {
    DIFFERENT_ACCOUNT = 'DIFFERENT_ACCOUNT',
    TOO_EXPENSIVE = 'TOO_EXPENSIVE',
    MISSING_FEATURE = 'MISSING_FEATURE',
    QUALITY_ISSUE = 'QUALITY_ISSUE',
    STREAMING_SERVICE_UNSUPPORTED = 'STREAMING_SERVICE_UNSUPPORTED',
    SWITCHING_TO_DIFFERENT_SERVICE = 'SWITCHING_TO_DIFFERENT_SERVICE',
    VPN_CONNECTION_ISSUE = 'VPN_CONNECTION_ISSUE',
    NOT_WILLING_TO_SHARE = 'NOT_WILLING_TO_SHARE',
    TEMPORARY = 'TEMPORARY',
    OTHER = 'OTHER',
}

interface ReasonOption {
    title: string;
    value: string;
}

interface ReasonDetail {
    forReason: SUBSCRIPTION_CANCELLATION_REASONS;
    content: ReactNode;
}

export type KeepSubscription = {
    status: 'kept';
};

export function isKeepSubscription(data: FeedbackDowngradeResult): data is KeepSubscription {
    return (data as KeepSubscription)?.status === 'kept';
}

export type FeedbackDowngradeResult = FeedbackDowngradeData | KeepSubscription;

export type FeedbackDowngradeModalProps = Omit<ModalProps, 'onSubmit'> & {
    user: UserModel;
};

type PromiseHandlers = ModalTwoPromiseHandlers<FeedbackDowngradeResult>;

const FeedbackDowngradeModal = ({
    onResolve,
    onClose,
    user,
    onReject,
    ...rest
}: FeedbackDowngradeModalProps & PromiseHandlers) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const { APP_NAME } = useConfig();

    const { isPaid } = user;

    const { sendFeedbackModalCancelReport, sendFeedbackModalSubmitReport } = useCancellationTelemetry();

    const isVpnApp =
        APP_NAME === APPS.PROTONVPN_SETTINGS || getAppFromPathnameSafe(location.pathname) === APPS.PROTONVPN_SETTINGS;

    const [model, setModel] = useState<FeedbackDowngradeData>({
        Reason: '',
        Feedback: '',
        ReasonDetails: '',
        Context: isVpnApp ? 'vpn' : 'mail',
    });
    const { validator, onFormSubmit } = useFormErrors();

    const [randomisedOptions] = useState(() => {
        const reasons: ReasonOption[] = [
            !isVpnApp
                ? {
                      title: c('Downgrade account reason').t`I use a different ${BRAND_NAME} account`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.DIFFERENT_ACCOUNT,
                  }
                : undefined,
            isPaid
                ? {
                      title: isVpnApp
                          ? c('Downgrade account reason').t`I found a cheaper VPN`
                          : c('Downgrade account reason').t`Subscription is too expensive`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.TOO_EXPENSIVE,
                  }
                : undefined,
            {
                title: c('Downgrade account reason').t`Missing feature(s)`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE,
            },
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`The VPN is too slow`
                    : c('Downgrade account reason').t`Bugs or quality issue`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE,
            },
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`It doesn't do what I need`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.STREAMING_SERVICE_UNSUPPORTED,
                  }
                : undefined,
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`I found a VPN with better features`
                    : c('Downgrade account reason').t`Switching to a different provider`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE,
            },
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`I only needed a VPN short-term`
                    : c('Downgrade account reason').t`Temporary need, may come back in the future`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.TEMPORARY,
            },
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`I have not managed to connect`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.VPN_CONNECTION_ISSUE,
                  }
                : undefined,
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`I do not wish to share`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.NOT_WILLING_TO_SHARE,
                  }
                : undefined,
        ].filter(isTruthy);
        return shuffle(reasons);
    });

    const options = [
        ...randomisedOptions.map(({ title, value }) => <Option key={value} title={title} value={value} />),
        <Option
            title={c('Downgrade account reason').t`Other reason (please comment)`}
            value={SUBSCRIPTION_CANCELLATION_REASONS.OTHER}
            key={SUBSCRIPTION_CANCELLATION_REASONS.OTHER}
        />,
    ];

    const sharedReasonDetailsProps = {
        value: model.ReasonDetails,
        onValue: (value: string) => setModel((model) => ({ ...model, ReasonDetails: value })),
    };
    const reasonDetails: ReasonDetail[] = [
        {
            forReason: SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE,
            content: (
                <InputFieldTwo
                    id={SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify?`}
                    error={validator(
                        model.Reason === SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE
                            ? [requiredValidator(model.ReasonDetails)]
                            : []
                    )}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE,
            content: (
                <InputFieldTwo
                    id={SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify?`}
                    error={validator(
                        model.Reason === SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE
                            ? [requiredValidator(model.ReasonDetails)]
                            : []
                    )}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: SUBSCRIPTION_CANCELLATION_REASONS.STREAMING_SERVICE_UNSUPPORTED,
            content: (
                <InputFieldTwo
                    id={SUBSCRIPTION_CANCELLATION_REASONS.STREAMING_SERVICE_UNSUPPORTED}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify which streaming service?`}
                    error={validator(
                        model.Reason === SUBSCRIPTION_CANCELLATION_REASONS.STREAMING_SERVICE_UNSUPPORTED
                            ? [requiredValidator(model.ReasonDetails)]
                            : []
                    )}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE,
            content: (
                <InputFieldTwo
                    id={SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please let us know which provider?`}
                    error={validator(
                        model.Reason === SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE
                            ? [requiredValidator(model.ReasonDetails)]
                            : []
                    )}
                    {...sharedReasonDetailsProps}
                />
            ),
        },
    ];

    const handleSubmit = () => {
        if (!onFormSubmit()) {
            return;
        }

        const shouldSendReasonDetails = reasonDetails.some(({ forReason }) => model.Reason === forReason);

        const data: FeedbackDowngradeData = {
            ...model,
            ReasonDetails: shouldSendReasonDetails ? model.ReasonDetails : '',
        };

        sendFeedbackModalSubmitReport();
        onResolve(data);
        onClose?.();
    };

    const handleKeepSubscription = () => {
        onResolve({ status: 'kept' });
        sendFeedbackModalCancelReport();
        onClose?.();
    };

    const cancelFeedbackText = isB2BTrial ? c('b2b_trials_Action').t`Keep subscription` : c('Action').t`Cancel`;
    const submitFeedbackText = isB2BTrial ? c('b2b_trials_Action').t`Cancel subscription` : c('Action').t`Submit`;
    const submitFeedbackColor = isB2BTrial ? 'danger' : 'norm';

    return (
        <Modal as={Form} onClose={handleKeepSubscription} onSubmit={handleSubmit} data-testid="help-improve" {...rest}>
            <ModalHeader title={c('Downgrade modal exit survey title').t`Help us improve`} />
            <ModalContent>
                <InputFieldTwo
                    as={SelectTwo}
                    label={c('Label').t`What is your main reason for canceling or downgrading?`}
                    placeholder={c('Placeholder').t`Select a reason`}
                    id="reason"
                    autoFocus
                    value={model.Reason}
                    onValue={(value: unknown) => setModel((model) => ({ ...model, Reason: value as string }))}
                    error={validator([requiredValidator(model.Reason)])}
                >
                    {options}
                </InputFieldTwo>

                {reasonDetails.map(({ forReason, content }) => {
                    if (model.Reason !== forReason) {
                        return;
                    }
                    return <Fragment key={forReason}>{content}</Fragment>;
                })}

                <InputFieldTwo
                    id="feedback"
                    as={TextAreaTwo}
                    rootClassName="mt-2"
                    rows={5}
                    label={c('Label').t`Do you have any suggestions for our team?`}
                    hint={c('Label').t`Optional`}
                    placeholder={c('Placeholder').t`Share what you think could make ${BRAND_NAME} better`}
                    value={model.Feedback}
                    onValue={(value: string) => setModel((model) => ({ ...model, Feedback: value }))}
                />
            </ModalContent>
            <ModalFooter>
                <Button data-testid="cancelFeedback" onClick={handleKeepSubscription}>
                    {cancelFeedbackText}
                </Button>
                <Button data-testid="submitFeedback" type="submit" color={submitFeedbackColor}>
                    {submitFeedbackText}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default FeedbackDowngradeModal;
