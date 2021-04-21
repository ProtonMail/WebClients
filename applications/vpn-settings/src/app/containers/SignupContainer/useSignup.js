import { useState, useEffect } from 'react';
import { handlePaymentToken } from 'react-components/containers/payments/paymentTokenHelper';
import { srpVerify, srpAuth } from 'proton-shared/lib/srp';
import {
    useApi,
    usePlans,
    useConfig,
    useApiResult,
    useModals,
    useVPNCountriesCount,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';
import { getUser, queryCreateOldUser, queryDirectSignupStatus } from 'proton-shared/lib/api/user';
import { auth } from 'proton-shared/lib/api/auth';
import { subscribe, setPaymentMethod, verifyPayment, checkSubscription } from 'proton-shared/lib/api/payments';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import {
    DEFAULT_CURRENCY,
    CYCLE,
    PLAN_TYPES,
    TOKEN_TYPES,
    CURRENCIES,
    PAYMENT_METHOD_TYPES,
} from 'proton-shared/lib/constants';
import { getPlan, PLAN, VPN_PLANS, PLAN_BUNDLES } from './plans';

const firstIn = (array, values) => values.find((value) => value && array.includes(value));
const toPlanMap = (plans) => plans.reduce((planMap, plan) => ({ ...planMap, [plan.ID]: 1 }), {});

const getSignupAvailability = (isDirectSignupEnabled, allowedMethods = []) => {
    const email = allowedMethods.includes(TOKEN_TYPES.EMAIL);
    const sms = allowedMethods.includes(TOKEN_TYPES.SMS);
    const paid = allowedMethods.includes(TOKEN_TYPES.PAYMENT);
    const free = email || sms;

    return {
        allowedMethods,
        inviteOnly: !isDirectSignupEnabled || (!free && !paid),
        email,
        free,
        sms,
        paid,
    };
};

/**
 * @param {Function} onLogin - callback after login that is done after registration
 * @param {{
 *  coupon: { plan, code, cycle },
 *  invite: String
 *  availablePlans: string[]
 * }} config -  coupon/invite is ignored if method is not allowed
 * @param {Object} initialModel - initially set values
 */
const useSignup = (onLogin, { coupon, invite, availablePlans = VPN_PLANS } = {}, initialModel = {}) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();
    const { result } = useApiResult(() => queryDirectSignupStatus(CLIENT_TYPE), []);
    const [plans] = usePlans();
    const [plansWithCoupons, setPlansWithCoupons] = useState();
    const [countries, countriesLoading] = useVPNCountriesCount();
    const [appliedCoupon, setAppliedCoupon] = useState();
    const [appliedInvite, setAppliedInvite] = useState();

    const signupAvailability = result && getSignupAvailability(result.Direct, result.VerifyMethods);
    const isLoading = !plansWithCoupons || !signupAvailability || countriesLoading;

    const initialCycle = firstIn(Object.values(CYCLE), [initialModel.cycle, coupon && coupon.cycle, CYCLE.YEARLY]);
    const initialPlan = firstIn(Object.values(PLAN), [initialModel.planName, coupon && coupon.plan, PLAN.PLUS]);
    const initialCurrency = firstIn(CURRENCIES, [
        initialModel.currency,
        plans && plans[0] && plans[0].Currency,
        DEFAULT_CURRENCY,
    ]);

    const [model, setModel] = useState({
        planName: initialPlan,
        cycle: initialCycle,
        currency: initialCurrency,
        email: initialModel.email || '',
        username: initialModel.username || '',
        password: initialModel.password || '',
    });

    const getPlanByName = (planName, cycle = model.cycle) =>
        getPlan(planName, cycle, plansWithCoupons || [], countries);

    // Until we can query plans+coupons at once, we need to check each plan individually
    useEffect(() => {
        const getPlansWithCoupon = async (plans, bundleName) => {
            const { AmountDue, CouponDiscount, Coupon } = await api(
                checkSubscription({
                    CouponCode: coupon.code,
                    Currency: model.currency,
                    Cycle: model.cycle,
                    PlanIDs: toPlanMap(plans),
                })
            );
            const sum = (a = 0, b = 0) => a + b;
            const plan = !bundleName
                ? plans[0]
                : {
                      // Constructs artificial plan for bundles
                      Name: bundleName,
                      Type: PLAN_TYPES.PLAN,
                      MaxVPN: Math.max(...plans.map(({ MaxVPN }) => MaxVPN)),
                      Pricing: plans.reduce(
                          (pricing, plan) => ({
                              ...pricing,
                              [CYCLE.MONTHLY]: sum(plan.Pricing[CYCLE.MONTHLY], pricing[CYCLE.MONTHLY]),
                              [CYCLE.YEARLY]: sum(plan.Pricing[CYCLE.YEARLY], pricing[CYCLE.YEARLY]),
                              [CYCLE.TWO_YEARS]: sum(plan.Pricing[CYCLE.TWO_YEARS], pricing[CYCLE.TWO_YEARS]),
                          }),
                          {}
                      ),
                  };
            return Coupon
                ? {
                      ...plan,
                      AmountDue,
                      CouponDiscount,
                      CouponDescription: Coupon.Description,
                  }
                : plan;
        };
        const getPlanWithCoupon = (plan) => getPlansWithCoupon([plan]);

        const applyCoupon = async () => {
            const bundle = PLAN_BUNDLES[model.planName];
            const plansInfo = plans.filter(
                ({ Name, Type }) => Type === PLAN_TYPES.PLAN && availablePlans.includes(Name)
            );

            const bundlePlans =
                bundle && plans.filter(({ Name, Type }) => Type === PLAN_TYPES.PLAN && bundle.includes(Name));
            const bundlePlan = bundle ? getPlansWithCoupon(bundlePlans, model.planName) : undefined;

            const plansWithCoupons = await Promise.all(
                bundlePlan ? [...bundlePlans, bundlePlan] : plansInfo.map(getPlanWithCoupon)
            );
            setAppliedCoupon(coupon);
            setPlansWithCoupons(plansWithCoupons);
        };

        if (!plans || !result) {
            return;
        }

        if (coupon && !result.VerifyMethods.includes(TOKEN_TYPES.COUPON)) {
            createNotification({ type: 'error', text: c('Notification').t`Coupons are temporarily disabled` });
        }

        if (coupon) {
            applyCoupon();
        } else {
            setPlansWithCoupons(plans);
        }
    }, [availablePlans, result, plans, coupon, model.cycle, model.currency]);

    useEffect(() => {
        if (!invite || !signupAvailability) {
            return;
        }

        if (!signupAvailability.allowedMethods.includes(TOKEN_TYPES.INVITE)) {
            createNotification({ type: 'error', text: c('Notification').t`Invites are temporarily disabled` });
        } else {
            setAppliedInvite(invite);
        }
    }, [invite, signupAvailability]);

    /**
     * Makes payment, verifies it and saves payment details for signup
     * @param {*=} paymentParameters payment parameters from usePayment
     * @returns {Promise<{ VerifyCode, Payment }>} - paymentDetails
     */
    const makePayment = async (model, paymentParameters) => {
        const selectedPlan = getPlanByName(model.planName, model.cycle);
        const amount = selectedPlan.price.total;

        if (amount > 0) {
            const { Payment } = await handlePaymentToken({
                params: {
                    Amount: selectedPlan.price.total,
                    Currency: model.currency,
                    ...paymentParameters,
                },
                api,
                createModal,
            });

            const { VerifyCode } = await api(
                verifyPayment({
                    Amount: amount,
                    Currency: model.currency,
                    Payment,
                })
            );

            return { VerifyCode, Payment };
        }

        return null;
    };

    const getToken = ({ coupon, invite, verificationToken, paymentDetails }) => {
        if (invite) {
            return { Token: `${invite.selector}:${invite.token}`, TokenType: TOKEN_TYPES.INVITE };
        }
        if (paymentDetails) {
            return { Token: paymentDetails.VerifyCode, TokenType: TOKEN_TYPES.PAYMENT };
        }
        if (coupon) {
            return { Token: coupon.code, TokenType: TOKEN_TYPES.COUPON };
        }
        return verificationToken;
    };

    const signup = async (model, signupToken) => {
        const { Token, TokenType } = getToken(signupToken);
        const { planName, password, email, username, currency, cycle, payload } = model;
        const selectedPlan = getPlanByName(planName, cycle);

        await srpVerify({
            api,
            credentials: { password },
            config: queryCreateOldUser({
                Token,
                TokenType,
                Type: CLIENT_TYPE,
                Email: email,
                Username: username,
                Payload: payload,
            }),
        });

        const authResult = await srpAuth({
            api,
            credentials: { username, password },
            config: auth({ Username: username }),
        });
        const { UID, AccessToken } = authResult;

        // Add subscription
        // Amount = 0 means - paid before subscription
        if (planName !== PLAN.FREE) {
            const bundle = PLAN_BUNDLES[selectedPlan.planName];
            const plans = bundle ? bundle.map((name) => getPlanByName(name)) : [selectedPlan];
            const subscription = {
                PlanIDs: toPlanMap(plans),
                Amount: 0,
                Currency: currency,
                Cycle: cycle,
                CouponCode: signupToken.coupon ? signupToken.coupon.code : undefined,
            };
            await api(withAuthHeaders(UID, AccessToken, subscribe(subscription)));
        }

        // Add payment method
        if (
            signupToken.paymentDetails &&
            [PAYMENT_METHOD_TYPES.CARD, PAYMENT_METHOD_TYPES.PAYPAL].includes(signupToken.paymentMethodType)
        ) {
            await api(withAuthHeaders(UID, AccessToken, setPaymentMethod(signupToken.paymentDetails.Payment)));
        }

        const { User } = await api(withAuthHeaders(UID, AccessToken, getUser()));
        await persistSession({ ...authResult, User, api });
        await onLogin({ ...authResult, User });
    };

    return {
        model,
        isLoading,
        getPlanByName,
        selectedPlan: getPlanByName(model.planName),
        signupAvailability,
        appliedCoupon,
        appliedInvite,

        makePayment,
        setModel,
        signup,
    };
};

export default useSignup;
