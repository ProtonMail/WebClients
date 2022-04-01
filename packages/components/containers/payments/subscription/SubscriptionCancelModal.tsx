import { Fragment, ReactNode, useState } from 'react';
import { c, msgid } from 'ttag';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';
import { BRAND_NAME, PLANS, PLAN_NAMES, SUBSCRIPTION_CANCELLATION_REASONS } from '@proton/shared/lib/constants';
import { shuffle } from '@proton/shared/lib/helpers/array';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Plan, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getIsLegacyPlan } from '@proton/shared/lib/helpers/subscription';
import {
    Alert,
    Button,
    InputFieldTwo,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    Form,
} from '../../../components';
import { useConfig, useSubscription, useVPNCountriesCount, useVPNServersCount } from '../../../hooks';

import { formatPlans } from './helpers';
import SubscriptionCancelPlan from './SubscriptionCancelPlan';
import { getShortPlan } from '../features/plan';

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
    OTHER,
} = SUBSCRIPTION_CANCELLATION_REASONS;

enum STEPS {
    CONFIRM,
    REASON,
}

export interface SubscriptionCancelModel {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
}
interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (model: SubscriptionCancelModel) => void;
    plans: Plan[] | undefined;
    user: UserModel;
}

const SubscriptionCancelModal = ({ onSubmit, onClose, plans, user, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    const { isPaid } = user;

    const [subscription, loadingSubscription] = useSubscription();
    const { Plans = [], PeriodEnd } = subscription;
    const { mailPlan, vpnPlan } = formatPlans(Plans);

    const isVpnApp = APP_NAME === 'proton-vpn-settings';

    const getIsVpnPlan = () => {
        if (vpnPlan !== undefined && mailPlan === undefined) {
            return true;
        }

        if (mailPlan !== undefined && vpnPlan === undefined) {
            return false;
        }

        return isVpnApp;
    };

    const isVpnPlan = getIsVpnPlan();

    const currentPlan = isVpnPlan ? (vpnPlan as Plan) : (mailPlan as Plan);
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const plansMap = toMap(plans, 'Name');

    const downgradedPlanNameKey = PLANS.FREE;
    const downgradedPlanName = [BRAND_NAME, PLAN_NAMES[downgradedPlanNameKey]].filter(isTruthy).join(' ');
    const downgradedPlanFeatures = getShortPlan(downgradedPlanNameKey, plansMap, vpnCountries, vpnServers);
    const planFeatures = getShortPlan(currentPlan.Name as PLANS, plansMap, vpnCountries, vpnServers);

    const [step, setStep] = useState<STEPS>(() => (planFeatures ? STEPS.CONFIRM : STEPS.REASON));
    const [model, setModel] = useState<SubscriptionCancelModel>({
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
                      title: c('Downgrade account reason').t`I use a different Proton account`,
                      value: DIFFERENT_ACCOUNT,
                  }
                : undefined,
            isPaid
                ? {
                      title: c('Downgrade account reason').t`Subscription is too expensive`,
                      value: TOO_EXPENSIVE,
                  }
                : undefined,
            {
                title: c('Downgrade account reason').t`Missing feature(s)`,
                value: MISSING_FEATURE,
            },
            {
                title: c('Downgrade account reason').t`Bugs or quality issue`,
                value: QUALITY_ISSUE,
            },
            isVpnApp
                ? {
                      title: c('Downgrade account reason').t`Streaming service unsupported`,
                      value: STREAMING_SERVICE_UNSUPPORTED,
                  }
                : undefined,
            {
                title: c('Downgrade account reason').t`Switching to a different provider`,
                value: SWITCHING_TO_DIFFERENT_SERVICE,
            },
            {
                title: c('Downgrade account reason').t`Temporary need, may come back in the future`,
                value: TEMPORARY,
            },
        ].filter(isTruthy);
        return shuffle(reasons);
    });

    const {
        title,
        section,
        footer,
        ...modalStepProps
    }: {
        title: string;
        section: ReactNode;
        footer: ReactNode;
        onSubmit?: () => void;
        size?: ModalProps['size'];
    } = (() => {
        if (step === STEPS.CONFIRM) {
            const daysRemaining = getDifferenceInDays(new Date(), new Date(PeriodEnd * 1000));

            const currentPlanName = [
                getIsLegacyPlan(currentPlan.Name) ? BRAND_NAME : '',
                PLAN_NAMES[currentPlan.Name as PLANS],
            ]
                .filter(isTruthy)
                .join(' ');

            // translator: daysRemaining contains the number of days remaining for the current subscription eg 288 days remaining
            const planTimeRemainingString = c('new_plans: Plan time remaining').ngettext(
                msgid`You still have ${daysRemaining} day left on your ${currentPlanName} account.`,
                `You still have ${daysRemaining} days left on your ${currentPlanName} account.`,
                daysRemaining
            );

            // translator: will be something like "Downgrade to Proton Free" (where "Free" is the plan name)
            const downgradeButtonString = c('new_plans: Action').t`Downgrade to ${downgradedPlanName}`;

            // translator: will be something like "Keep my Proton Plus account"
            const keepButtonString = c('new_plans: Action').t`Keep my ${currentPlanName} account`;

            return {
                title: c('Title').t`Downgrade account`,
                size: 'large',
                section: loadingSubscription ? (
                    <Loader />
                ) : (
                    <>
                        {daysRemaining > 0 && (
                            <Alert className="mb1" type="warning">
                                {planTimeRemainingString}
                                <br />
                                {c('Info')
                                    .t`By downgrading you will lose the following benefits. Are you sure you want to proceed?`}
                            </Alert>
                        )}
                        <div className="flex flex-row flex-nowrap on-mobile-flex-column">
                            <SubscriptionCancelPlan
                                name={downgradedPlanName}
                                info={downgradedPlanFeatures?.description || ''}
                                features={planFeatures?.features || []}
                                downgrade
                            />
                            <SubscriptionCancelPlan
                                name={currentPlanName}
                                info={planFeatures?.description || ''}
                                features={planFeatures?.features || []}
                            />
                        </div>
                    </>
                ),
                footer: (
                    <>
                        <Button
                            disabled={loadingSubscription}
                            className="on-mobile-w100 on-mobile-mb1"
                            onClick={() => {
                                setStep(STEPS.REASON);
                            }}
                        >
                            {downgradeButtonString}
                        </Button>
                        <Button
                            className="on-mobile-w100"
                            disabled={loadingSubscription}
                            color="norm"
                            onClick={onClose}
                        >
                            {keepButtonString}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEPS.REASON) {
            const options = [
                ...randomisedOptions.map(({ title, value }) => <Option key={value} title={title} value={value} />),
                <Option
                    title={c('Downgrade account reason').t`My reason isn't listed, please comment`}
                    value={OTHER}
                    key={OTHER}
                />,
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
                            error={validator(
                                model.Reason === MISSING_FEATURE ? [requiredValidator(model.ReasonDetails)] : []
                            )}
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
                            error={validator(
                                model.Reason === QUALITY_ISSUE ? [requiredValidator(model.ReasonDetails)] : []
                            )}
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
                                model.Reason === STREAMING_SERVICE_UNSUPPORTED
                                    ? [requiredValidator(model.ReasonDetails)]
                                    : []
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
                                model.Reason === SWITCHING_TO_DIFFERENT_SERVICE
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

                onSubmit({ ...model, ReasonDetails: shouldSendReasonDetails ? model.ReasonDetails : '' });
                onClose?.();
            };

            return {
                title: c('Downgrade modal exit survey title').t`Help us improve!`,
                onSubmit: handleSubmit,
                section: (
                    <>
                        <InputFieldTwo
                            as={SelectTwo}
                            label={c('Label').t`What is the main reason you are cancelling?`}
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
                            rootClassName="mt0-5"
                            rows={5}
                            label={c('Label').t`Do you have any suggestions for our team?`}
                            hint={c('Label').t`Optional`}
                            placeholder={c('Placeholder').t`Feedback`}
                            value={model.Feedback}
                            onValue={(value: string) => setModel({ ...model, Feedback: value })}
                        />
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button type="submit" color="norm">
                            {c('Action').t`Submit`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <Modal as={Form} onClose={onClose} {...modalStepProps} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{section}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default SubscriptionCancelModal;
