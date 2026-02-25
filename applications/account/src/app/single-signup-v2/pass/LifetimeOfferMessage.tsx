import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { Currency } from '@proton/payments';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { SSO_PATHS } from '@proton/shared/lib/constants';

type Props = {
    currency: Currency;
    price: number | null;
    email?: string;
};

const PassLifetimeSpecialOffer = ({ currency, price, email }: Props) => {
    if (!price) {
        return null;
    }

    const priceString = getSimplePriceString(currency, price);

    const handleClick = () => {
        const searchParams = new URLSearchParams();
        searchParams.append('plan', PLANS.PASS_LIFETIME);
        if (email) {
            searchParams.append('email', email);
        }

        window.location.href = `${SSO_PATHS.PASS_SIGNUP}?${searchParams.toString()}`;
    };

    return (
        <Card rounded className="flex justify-center items-center gap-2 text-lg text-semibold mt-4">
            <span>
                {
                    // translator: full sentence example: "Special: Pass + SimpleLogin Lifetime at $199."
                    c('pass_signup_2023: Info').t`Special: ${PLAN_NAMES[PLANS.PASS_LIFETIME]} at ${priceString}.`
                }
            </span>
            <Button size="small" color="norm" onClick={handleClick}>
                {c('pass_signup_2023: Action').t`Buy now`}
            </Button>
        </Card>
    );
};

export default PassLifetimeSpecialOffer;
