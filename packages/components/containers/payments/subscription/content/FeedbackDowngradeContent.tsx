import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';
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
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';
import { useIsB2BTrial } from '@proton/payments/ui';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { maxLengthValidator, minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserModel } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import shuffle from '@proton/utils/shuffle';

import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import { useFeedbackFirstEligibility } from '../cancellationFlowFeedbackFirst/useFeedbackFirstEligibility';

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

type FeedbackDowngradeContentProps = {
    user: UserModel;
    onResolve: ModalTwoPromiseHandlers<FeedbackDowngradeResult>['onResolve'];
    onClose?: () => void;
};

const FeedbackDowngradeContent = ({ onResolve, onClose, user }: FeedbackDowngradeContentProps) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const { APP_NAME } = useConfig();
    const { hasB2CAccess, hasB2BAccess } = useFeedbackFirstEligibility();
    const isEligibleForFeedbackFirst = hasB2CAccess || hasB2BAccess;

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
    const { validator, onFormSubmit, reset: resetFormErrors } = useFormErrors();
    const [selectedProvider, setSelectedProvider] = useState('');

    const [randomisedOptions] = useState(() => {
        const showVpnSpecificReasons = isVpnApp && !isEligibleForFeedbackFirst;

        const reasons: ReasonOption[] = [
            !showVpnSpecificReasons
                ? {
                      title: c('Downgrade account reason').t`I use a different ${BRAND_NAME} account`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.DIFFERENT_ACCOUNT,
                  }
                : undefined,
            isPaid
                ? {
                      title: showVpnSpecificReasons
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
                title: showVpnSpecificReasons
                    ? c('Downgrade account reason').t`The VPN is too slow`
                    : c('Downgrade account reason').t`Bugs or quality issue`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE,
            },
            showVpnSpecificReasons
                ? {
                      title: c('Downgrade account reason').t`It doesn't do what I need`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.STREAMING_SERVICE_UNSUPPORTED,
                  }
                : undefined,
            {
                title: showVpnSpecificReasons
                    ? c('Downgrade account reason').t`I found a VPN with better features`
                    : c('Downgrade account reason').t`Switching to a different provider`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE,
            },
            {
                title: showVpnSpecificReasons
                    ? c('Downgrade account reason').t`I only needed a VPN short-term`
                    : c('Downgrade account reason').t`Temporary need, may come back in the future`,
                value: SUBSCRIPTION_CANCELLATION_REASONS.TEMPORARY,
            },
            showVpnSpecificReasons
                ? {
                      title: c('Downgrade account reason').t`I have not managed to connect`,
                      value: SUBSCRIPTION_CANCELLATION_REASONS.VPN_CONNECTION_ISSUE,
                  }
                : undefined,
            showVpnSpecificReasons
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

    const isB2B = !!organization?.IsBusiness;

    const providerOptions = isB2B
        ? [
              <Option title={c('Provider option').t`Microsoft 365`} value="Microsoft 365" key="microsoft365" />,
              <Option
                  title={c('Provider option').t`Google Workspace`}
                  value="Google Workspace"
                  key="googleworkspace"
              />,
              <Option title={c('Provider option').t`Other`} value="Other" key="other" />,
          ]
        : [
              <Option title={c('Provider option').t`Gmail`} value="Gmail" key="gmail" />,
              <Option title={c('Provider option').t`Outlook`} value="Outlook" key="outlook" />,
              <Option title={c('Provider option').t`Yahoo`} value="Yahoo" key="yahoo" />,
              <Option title={c('Provider option').t`Other`} value="Other" key="other" />,
          ];

    const sharedReasonDetailsProps = {
        value: model.ReasonDetails,
        className: 'border-weak rounded-lg mt-4',
        onValue: (value: string) => setModel((model) => ({ ...model, ReasonDetails: value })),
        assistContainerClassName: 'mb-2',
    };
    const reasonDetails: ReasonDetail[] = [
        {
            forReason: SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE,
            content: (
                <InputFieldTwo
                    id={SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE}
                    as={TextAreaTwo}
                    rows={2}
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
                    rows={2}
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
                    rows={2}
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
                <div>
                    <label
                        htmlFor={SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE}
                        className="text-semibold mb-4"
                    >{c('Label').t`Could you please let us know which provider?`}</label>
                    <div className="flex justify-space-between items-center gap-2 my-4">
                        <InputFieldTwo
                            id={SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE}
                            as={SelectTwo}
                            placeholder={c('Placeholder').t`Select a provider`}
                            value={selectedProvider}
                            onValue={(value: unknown) => {
                                const provider = value as string;
                                setSelectedProvider(provider);
                                resetFormErrors();
                                setModel((model) => ({
                                    ...model,
                                    ReasonDetails: provider === 'Other' ? '' : provider,
                                }));
                            }}
                            error={validator(
                                model.Reason === SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE
                                    ? [requiredValidator(selectedProvider)]
                                    : []
                            )}
                            className="border-weak rounded-lg"
                            rootClassName="w-full md:w-1/2"
                        >
                            {providerOptions}
                        </InputFieldTwo>
                        {selectedProvider === 'Other' && (
                            <InputFieldTwo
                                id="provider-name"
                                value={model.ReasonDetails}
                                onValue={(value: string) => {
                                    setModel((model) => ({ ...model, ReasonDetails: value }));
                                }}
                                maxLength={20}
                                error={validator([
                                    requiredValidator(model.ReasonDetails),
                                    minLengthValidator(model.ReasonDetails, 2),
                                    maxLengthValidator(model.ReasonDetails, 20),
                                ])}
                                placeholder={c('Placeholder').t`Enter a name`}
                                className="border-weak rounded-lg"
                                rootClassName="flex-1"
                            />
                        )}
                    </div>
                </div>
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

    const handleSkipFeedback = () => {
        onResolve({
            Reason: '',
            Feedback: '',
            ReasonDetails: '',
            Context: model.Context,
        });
        onClose?.();
    };

    const cancelFeedbackText = isB2BTrial ? c('b2b_trials_Action').t`Keep subscription` : c('Action').t`Cancel`;
    const submitFeedbackText = isB2BTrial ? c('b2b_trials_Action').t`Cancel subscription` : c('Action').t`Submit`;
    const submitFeedbackColor = isB2BTrial ? 'danger' : 'norm';
    const skipFeedbackText = c('Label').t`Skip feedback`;
    const continueCancellingText = c('Label').t`Continue cancelling`;

    return (
        <>
            <ModalHeader title={c('Downgrade modal exit survey title').t`Help us improve`} />
            <ModalContent>
                <p className="mt-0 mb-10 color-weak" data-testid="feedback-reason-subtitle">
                    {c('Description')
                        .t`We’re sorry to see you go. If you have a moment, we’d really appreciate hearing why you’d like to cancel. Your feedback helps us make ${BRAND_NAME} better for everyone.`}
                </p>
                <div className="mb-2">
                    <div className="flex items-start justify-start gap-2 mb-4">
                        <CircledNumber className="mx-0" number={1} />
                        <label htmlFor="reason" className="text-semibold">{c('Label')
                            .t`Main reason for cancelling`}</label>
                    </div>
                    <div className="pl-6">
                        <InputFieldTwo
                            as={SelectTwo}
                            placeholder={c('Placeholder').t`Select a reason`}
                            id="reason"
                            autoFocus
                            value={model.Reason}
                            onValue={(value: unknown) => {
                                setModel((model) => ({ ...model, Reason: value as string, ReasonDetails: '' }));
                                setSelectedProvider('');
                                resetFormErrors();
                            }}
                            error={validator([requiredValidator(model.Reason)])}
                            className="border-weak rounded-lg"
                            rootClassName="w-full md:w-1/2"
                        >
                            {options}
                        </InputFieldTwo>
                    </div>
                </div>

                {reasonDetails.map(({ forReason, content }) => {
                    if (model.Reason !== forReason) {
                        return;
                    }
                    return (
                        <div className="pl-6" key={forReason}>
                            {content}
                        </div>
                    );
                })}

                <div className="mb-4">
                    <div className="flex items-start justify-start gap-2 mb-4">
                        <CircledNumber className="mx-0" number={2} />
                        <label htmlFor="feedback" className="text-semibold">{c('Label').t`Additional comments`}</label>
                        <span className="ml-auto color-weak text-sm">{c('Label').t`Optional`}</span>
                    </div>
                    <div className="pl-6">
                        <InputFieldTwo
                            id="feedback"
                            as={TextAreaTwo}
                            rootClassName="mt-2"
                            rows={10}
                            placeholder={c('Placeholder').t`Anything you'd like us to know`}
                            value={model.Feedback}
                            onValue={(value: string) => setModel((old) => ({ ...old, Feedback: value }))}
                            className="border-weak rounded-lg"
                        />
                    </div>
                </div>
            </ModalContent>
            <ModalFooter className={clsx('gap-2', isEligibleForFeedbackFirst && 'justify-end')}>
                <Button
                    data-testid="cancelFeedback"
                    onClick={isEligibleForFeedbackFirst ? handleSkipFeedback : handleKeepSubscription}
                    size="large"
                    className="rounded-lg"
                >
                    {isEligibleForFeedbackFirst ? skipFeedbackText : cancelFeedbackText}
                </Button>
                <Button
                    data-testid="submitFeedback"
                    onClick={handleSubmit}
                    color={isEligibleForFeedbackFirst ? 'danger' : submitFeedbackColor}
                    size="large"
                    className="rounded-lg"
                >
                    {isEligibleForFeedbackFirst ? continueCancellingText : submitFeedbackText}
                </Button>
            </ModalFooter>
        </>
    );
};

export default FeedbackDowngradeContent;
