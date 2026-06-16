import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useGetPlans } from '@proton/account/plans/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Badge } from '@proton/components/components/badge/Badge';
import Logo from '@proton/components/components/logo/Logo';
import Price from '@proton/components/components/price/Price';
import useApi from '@proton/components/hooks/useApi';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcChevronUpFilled } from '@proton/icons/icons/IcChevronUpFilled';
import { IcShield } from '@proton/icons/icons/IcShield';
import { PLANS, type Plan } from '@proton/payments';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { FeatureItem } from '../components/FeatureItem';
import { freeFeatures, paidFeatures } from '../utils/features';

const PlanPrice = () => {
    const [vpnPlan, setVpnPlan] = useState<Plan | undefined>();
    const api = useApi();
    const getPlans = useGetPlans();

    useEffect(() => {
        const fetchPlans = async () => {
            const { plans } = await getPlans({ api });
            const desiredPlan = plans.find((plan) => plan.Name === PLANS.VPN2024);

            setVpnPlan(desiredPlan);
        };

        void fetchPlans();
    }, []);

    return vpnPlan ? (
        <Price className="text-semibold" currency={vpnPlan.Currency} suffix="/month" suffixClassName="text-normal">
            {vpnPlan.Amount}
        </Price>
    ) : (
        <div className="h-custom" style={{ '--h-custom': '1.25rem' }} />
    );
};

const PaidFeatureList = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <div className="flex flex-column gap-2">
                {(isExpanded ? paidFeatures : paidFeatures.slice(0, 3)).map(({ included, text, tooltip }) => (
                    <FeatureItem key={text?.toString()} included={included} text={text?.toString()} tooltip={tooltip} />
                ))}
            </div>
            <button
                className="flex flex-row items-center gap-1 cursor-pointer bg-transparent w-fit-content"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? (
                    <IcChevronUpFilled className="color-primary" />
                ) : (
                    <IcChevronDownFilled className="color-primary" />
                )}
                <span className="color-primary">
                    {isExpanded ? c('Info').t`Show fewer benefits` : c('Info').t`Show more benefits`}
                </span>
            </button>
        </>
    );
};

const Surface = ({ signupPath }: { signupPath: string }) => {
    return (
        <Card background={false} rounded className="flex flex-column p-4 gap-6 w-full">
            <div className="flex flex-row flex-nowrap justify-space-between items-center">
                <div className="flex flex-row items-center gap-4">
                    <Logo appName="proton-vpn-settings" variant="glyph-only" />
                    <h4 className="text-semibold">{c('Info').t`VPN Plus`}</h4>
                </div>
                <Badge type="primary">{c('Info').t`BEST FOR TV`}</Badge>
            </div>
            <PlanPrice />
            <div className="flex flex-row items-center gap-1">
                <IcShield className="color-success" />
                <span className="color-success">{c('Info').t`30-day money-back guarantee`}</span>
            </div>
            <PaidFeatureList />
            <Link className="w-full" to={`${signupPath}?plan=${PLANS.VPN2024}&billing=1`}>
                <Button fullWidth color="norm" shape="solid">{c('Info').t`Get VPN Plus`}</Button>
            </Link>
        </Card>
    );
};

export const TvCheckout = ({ paths }: { searchParams: URLSearchParams; paths: { signup: string } }) => {
    return (
        <div
            className="flex flex-column gap-8 items-center w-full max-w-custom"
            style={{ '--max-w-custom': '30rem', 'justify-self': 'center' }}
        >
            <div className="flex flex-column gap-2 items-center">
                <h1 className="text-bold color-norm text-center">{c('Title').t`Get ${VPN_APP_NAME} on your TV`}</h1>
                <span className="color-weak text-center">{c('Info').t`Unlock streaming with VPN Plus.`}</span>
            </div>
            <Surface signupPath={paths.signup} />
            <Card rounded background className="flex flex-column gap-4">
                <span className="text-bold">{c('Info').t`${BRAND_NAME} Free`}</span>
                <div className="flex flex-row gap-1 items-center w-full">
                    {freeFeatures.map((feature, index) => (
                        <>
                            <span
                                key={feature.text as string}
                                className={index === freeFeatures.length - 1 ? 'color-danger' : ''}
                            >
                                {feature.text}
                            </span>
                            {index !== freeFeatures.length - 1 ? <span>·</span> : null}
                        </>
                    ))}
                </div>
                <Link className="w-full" to={`${paths.signup}?plan=${PLANS.FREE}`}>
                    <Button fullWidth>{c('Info').t`Continue with ${BRAND_NAME} Free`}</Button>
                </Link>
            </Card>
        </div>
    );
};
