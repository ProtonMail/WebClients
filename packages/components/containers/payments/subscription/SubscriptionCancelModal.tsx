import { Fragment, ReactNode, useState } from 'react';
import { c, msgid } from 'ttag';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';
import {
    BRAND_NAME,
    PLANS,
    PLAN_NAMES,
    PLAN_SERVICES,
    SUBSCRIPTION_CANCELLATION_REASONS,
} from '@proton/shared/lib/constants';
import { shuffle } from '@proton/shared/lib/helpers/array';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Plan } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import {
    Alert,
    Button,
    FormModal,
    InputFieldTwo,
    Loader,
    SelectTwo,
    Option,
    TextAreaTwo,
    useFormErrors,
} from '../../../components';
import { useConfig, useSubscription, useUser, useVPNCountriesCount, useVPNServersCount } from '../../../hooks';

import { formatPlans } from './helpers';
import SubscriptionCancelPlan from './SubscriptionCancelPlan';
import { getPlanFeatures, getPlanInfo } from './PlanSelection';

const NAMES = {
    free_mail: 'Free',
    free_vpn: 'Free',
    [PLANS.VPNBASIC]: 'Basic',
    [PLANS.VPNPLUS]: 'Plus',
    [PLANS.PLUS]: 'Plus',
    [PLANS.PROFESSIONAL]: 'Professional',
    [PLANS.VISIONARY]: 'Visionary',
} as const;

const usePlanFeatures = (plan: Plan, service: PLAN_SERVICES) => {
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();

    return getPlanFeatures(plan, service, vpnCountries, vpnServers);
};

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
interface Props {
    onClose: () => void;
    onSubmit: (model: SubscriptionCancelModel) => void;
}

const SubscriptionCancelModal = ({ onSubmit, onClose, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();

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
    const planFeatures = usePlanFeatures(currentPlan, isVpnPlan ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL);

    const [step, setStep] = useState<STEPS>(STEPS.CONFIRM);
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

    const { section, ...modalProps } = (() => {
        if (step === STEPS.CONFIRM) {
            const planInfo = getPlanInfo(isVpnPlan);

            const daysRemaining = getDifferenceInDays(new Date(), new Date(PeriodEnd * 1000));

            const downgradedPlanNameKey = isVpnPlan ? 'free_vpn' : 'free_mail';
            const downgradedPlanName = NAMES[downgradedPlanNameKey];

            const currentPlanName = PLAN_NAMES[currentPlan.Name as PLANS];

            // translator: daysRemaining contains the number of days remaining for the current subscription eg 288 days remaining
            const planTimeRemainingString = c('Plan time remaining').ngettext(
                msgid`You still have ${daysRemaining} day left on your ${BRAND_NAME} ${currentPlanName} account.`,
                `You still have ${daysRemaining} days left on your ${BRAND_NAME} ${currentPlanName} account.`,
                daysRemaining
            );

            // translator: will be something like "Downgrade to Proton Free" (where "Free" is the plan name)
            const downgradeButtonString = c('Action').t`Downgrade to ${BRAND_NAME} ${downgradedPlanName}`;

            // translator: will be something like "Keep my Proton Plus account"
            const keepButtonString = c('Action').t`Keep my ${BRAND_NAME} ${currentPlanName} account`;

            return {
                title: c('Title').t`Downgrade account`,
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
                                info={planInfo[downgradedPlanNameKey]}
                                features={planFeatures}
                                downgrade
                            />
                            <SubscriptionCancelPlan
                                name={PLAN_NAMES[currentPlan.Name as PLANS]}
                                info={planInfo[currentPlan.Name as PLANS]}
                                features={planFeatures}
                            />
                        </div>
                    </>
                ),
                footer: (
                    <div className="flex w100 flex-justify-space-between on-mobile-flex-column">
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
                            disabled={loadingSubscription}
                            className="on-mobile-w100"
                            color="norm"
                            onClick={onClose}
                        >
                            {keepButtonString}
                        </Button>
                    </div>
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
                onClose();
            };

            return {
                title: c('Downgrade modal exit survey title').t`Help us improve!`,
                submit: c('Action').t`Submit`,
                onSubmit: handleSubmit,
                section: (
                    <div className="w75 on-mobile-w100">
                        <InputFieldTwo
                            rootClassName="mb0-5"
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
                    </div>
                ),
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal className="subscription-cancel-modal" onClose={onClose} {...rest} {...modalProps}>
            {section}
        </FormModal>
    );
};

export default SubscriptionCancelModal;
