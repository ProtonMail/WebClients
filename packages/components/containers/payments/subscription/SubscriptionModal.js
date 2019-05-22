import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    usePlans,
    FormModal,
    Button,
    Price,
    usePayment,
    Payment,
    Paragraph,
    useStep,
    useApiWithoutResult,
    useApi,
    useEventManager,
    useNotifications,
    useSubscription,
    SubTitle,
    Label,
    Row,
    Field,
    Wizard
} from 'react-components';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';
import { checkSubscription, subscribe } from 'proton-shared/lib/api/payments';

import CustomMailSection from './CustomMailSection';
import CustomVPNSection from './CustomVPNSection';
import OrderSummary from './OrderSummary';
import FeaturesList from './FeaturesList';
import { getCheckParams } from './helpers';

const SubscriptionModal = ({ onClose, cycle, currency, coupon, plansMap, ...rest }) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const initialRun = useRef(true);
    const [loading, setLoading] = useState(false);
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment(handleSubmit);
    const { createNotification } = useNotifications();
    const [check, setCheck] = useState({});
    const [plans] = usePlans();
    const [model, setModel] = useState({ cycle, currency, coupon, plansMap });
    const { call } = useEventManager();
    const { step, next, previous } = useStep(0);
    const { request } = useApiWithoutResult(subscribe);

    const callCheck = async (m = model) => {
        try {
            setLoading(true);
            const result = await api(checkSubscription(getCheckParams({ ...m, plans })));
            const { Coupon, Gift } = result;
            const { Code } = Coupon || {}; // Coupon can equals null

            if (m.coupon && m.coupon !== Code) {
                const text = c('Error').t`Your coupon is invalid or cannot be applied to your plan`;
                createNotification({ text, type: 'error' });
                throw new Error(text);
            }

            if (m.gift && !Gift) {
                const text = c('Error').t`Invalid gift code`;
                createNotification({ text, type: 'error' });
                throw new Error(text);
            }

            setLoading(false);
            setCheck(result);
            return result;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const handleChangeModel = async (newModel = {}, requireCheck = false) => {
        if (loading) {
            return;
        }

        if (requireCheck) {
            await callCheck(newModel);
        }

        setModel(newModel);
    };

    const handleSubmit = async () => {
        if (!canPay) {
            return;
        }

        try {
            setLoading(true);
            await request({ Amount: check.AmountDue, ...getCheckParams({ ...model, plans }), ...parameters });
            await call();
            setLoading(false);
            next();
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const STEPS = [
        {
            title: c('Title').t`Order summary`,
            closeIfSubscriptionChange: true,
            section: <OrderSummary plans={plans} model={model} check={check} onChange={handleChangeModel} />,
            async onSubmit() {
                if (!check.AmountDue) {
                    try {
                        setLoading(true);
                        await request({ Amount: check.AmountDue, ...getCheckParams({ ...model, plans }) });
                        await call();
                        setLoading(false);
                    } catch (error) {
                        setLoading(false);
                        throw error;
                    }
                }
                next();
            }
        },
        {
            title: c('Title').t`Thank you!`,
            section: (
                <>
                    <SubTitle>{c('Info').t`Thank you for your subscription`}</SubTitle>
                    <Paragraph>{c('Info').t`Your new features are now available`}</Paragraph>
                    <FeaturesList />
                </>
            ),
            onSubmit: onClose
        }
    ];

    if (plansMap.vpnplus || plansMap.vpnbasic) {
        STEPS.unshift({
            title: c('Title').t`VPN protection`,
            closeIfSubscriptionChange: true,
            section: <CustomVPNSection plans={plans} model={model} onChange={handleChangeModel} />,
            async onSubmit() {
                await callCheck();
                next();
            }
        });
    }

    if (plansMap.plus || plansMap.professional) {
        STEPS.unshift({
            title: c('Title').t`Customization`,
            closeIfSubscriptionChange: true,
            section: <CustomMailSection plans={plans} model={model} onChange={handleChangeModel} />,
            async onSubmit() {
                await callCheck();
                next();
            }
        });
    }

    if (check.AmountDue > 0) {
        // Insert it before the last one
        STEPS.splice(STEPS.length - 1, 0, {
            title: c('Title').t`Payment details`,
            section: (
                <>
                    <Alert>{c('Info')
                        .t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>
                    <Row>
                        <Label>{c('Label').t`Amount due`}</Label>
                        <Field>
                            <Price currency={model.currency}>{check.AmountDue}</Price>
                        </Field>
                    </Row>
                    <Payment
                        type="subscription"
                        method={method}
                        amount={check.AmountDue}
                        currency={model.currency}
                        onParameters={setParameters}
                        onMethod={setMethod}
                        onValidCard={setCardValidity}
                    />
                    <Alert type="warning" learnMore="https://protonmail.com/terms-and-conditions">{c('Info')
                        .t`By clicking Next, you agree to abide by ProtonMail's terms and conditions.`}</Alert>
                </>
            ),
            onSubmit: handleSubmit
        });
    }

    const hasCancel = !step;
    const hasClose = step === STEPS.length - 1;
    const hasPrevious = !hasClose && step > 0;
    const hasNext = !hasClose;
    const steps = STEPS.map(({ title }) => title);

    const close = (() => {
        if (hasCancel) {
            return c('Action').t`Cancel`;
        }
        if (hasClose) {
            return c('Action').t`Close`;
        }
        if (hasPrevious) {
            return <Button onClick={previous}>{c('Action').t`Previous`}</Button>;
        }
    })();

    useEffect(() => {
        // If the subscription changes when we are editing the config, we close the modal
        if (!initialRun.current && STEPS[step].closeIfSubscriptionChange) {
            onClose();
            return createNotification({ text: c('Warning').t`You subscription has changed`, type: 'warning' });
        }
        initialRun.current = false;
    }, [subscription]);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={STEPS[step].onSubmit}
            title={STEPS[step].title}
            loading={loading}
            close={close}
            submit={hasNext && c('Action').t`Next`}
            {...rest}
        >
            <Wizard step={step} steps={steps} hideText={true} />
            {STEPS[step].section}
        </FormModal>
    );
};

SubscriptionModal.propTypes = {
    onClose: PropTypes.func,
    cycle: PropTypes.number,
    coupon: PropTypes.string,
    currency: PropTypes.string,
    plansMap: PropTypes.object
};

SubscriptionModal.defaultProps = {
    coupon: '',
    currency: DEFAULT_CURRENCY,
    cycle: DEFAULT_CYCLE,
    plansMap: {}
};

export default SubscriptionModal;
