import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalTwoPromiseHandlers } from '@proton/components/components/modalTwo/useModalTwo';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME, SUBSCRIPTION_CANCELLATION_REASONS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import shuffle from '@proton/utils/shuffle';

import type { ModalProps } from '../../../components';
import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    TextAreaTwo,
    useFormErrors,
} from '../../../components';
import { useConfig } from '../../../hooks';
import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';

interface ReasonOption {
    title: string;
    value: string;
}

interface ReasonDetail {
    forReason: SUBSCRIPTION_CANCELLATION_REASONS;
    content: ReactNode;
}

const {
    DIFFERENT_ACCOUNT,
    TOO_EXPENSIVE,
    MISSING_FEATURE,
    QUALITY_ISSUE,
    STREAMING_SERVICE_UNSUPPORTED,
    SWITCHING_TO_DIFFERENT_SERVICE,
    TEMPORARY,
    VPN_CONNECTION_ISSUE,
    NOT_WILLING_TO_SHARE,
    OTHER,
} = SUBSCRIPTION_CANCELLATION_REASONS;

export interface FeedbackDowngradeData {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
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
                      value: DIFFERENT_ACCOUNT,
                  }
                : undefined,
            isPaid
                ? {
                      title: isVpnApp
                          ? c('Downgrade account reason').t`I found a cheaper VPN`
                          : c('Downgrade account reason').t`Subscription is too expensive`,
                      value: TOO_EXPENSIVE,
                  }
                : undefined,
            {
                title: c('Downgrade account reason').t`Missing feature(s)`,
                value: MISSING_FEATURE,
            },
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`The VPN is too slow`
                    : c('Downgrade account reason').t`Bugs or quality issue`,
                value: QUALITY_ISSUE,
            },
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`It doesn't do what I need`,
                      value: STREAMING_SERVICE_UNSUPPORTED,
                  }
                : undefined,
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`I found a VPN with better features`
                    : c('Downgrade account reason').t`Switching to a different provider`,
                value: SWITCHING_TO_DIFFERENT_SERVICE,
            },
            {
                title: isVpnApp
                    ? c('Downgrade account reason').t`I only needed a VPN short-term`
                    : c('Downgrade account reason').t`Temporary need, may come back in the future`,
                value: TEMPORARY,
            },
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`I have not managed to connect`,
                      value: VPN_CONNECTION_ISSUE,
                  }
                : undefined,
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`I do not wish to share`,
                      value: NOT_WILLING_TO_SHARE,
                  }
                : undefined,
        ].filter(isTruthy);
        return shuffle(reasons);
    });

    const options = [
        ...randomisedOptions.map(({ title, value }) => <Option key={value} title={title} value={value} />),
        <Option title={c('Downgrade account reason').t`Other reason (please comment)`} value={OTHER} key={OTHER} />,
    ];

    const sharedReasonDetailsProps = {
        value: model.ReasonDetails,
        onValue: (value: string) => setModel({ ...model, ReasonDetails: value }),
    };
    const reasonDetails: ReasonDetail[] = [
        {
            forReason: MISSING_FEATURE,
            content: (
                <InputFieldTwo
                    id={MISSING_FEATURE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify?`}
                    error={validator(model.Reason === MISSING_FEATURE ? [requiredValidator(model.ReasonDetails)] : [])}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: QUALITY_ISSUE,
            content: (
                <InputFieldTwo
                    id={QUALITY_ISSUE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify?`}
                    error={validator(model.Reason === QUALITY_ISSUE ? [requiredValidator(model.ReasonDetails)] : [])}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: STREAMING_SERVICE_UNSUPPORTED,
            content: (
                <InputFieldTwo
                    id={STREAMING_SERVICE_UNSUPPORTED}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please specify which streaming service?`}
                    error={validator(
                        model.Reason === STREAMING_SERVICE_UNSUPPORTED ? [requiredValidator(model.ReasonDetails)] : []
                    )}
                    {...sharedReasonDetailsProps}
                />
            ),
        },

        {
            forReason: SWITCHING_TO_DIFFERENT_SERVICE,
            content: (
                <InputFieldTwo
                    id={SWITCHING_TO_DIFFERENT_SERVICE}
                    as={TextAreaTwo}
                    rows={3}
                    label={c('Label').t`Could you please let us know which provider?`}
                    error={validator(
                        model.Reason === SWITCHING_TO_DIFFERENT_SERVICE ? [requiredValidator(model.ReasonDetails)] : []
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
                    onValue={(value: unknown) => setModel({ ...model, Reason: value as string })}
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
                    onValue={(value: string) => setModel({ ...model, Feedback: value })}
                />
            </ModalContent>
            <ModalFooter>
                <Button data-testid="cancelFeedback" onClick={handleKeepSubscription}>{c('Action').t`Cancel`}</Button>
                <Button data-testid="submitFeedback" type="submit" color="norm">
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default FeedbackDowngradeModal;
