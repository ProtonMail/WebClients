import PropTypes from 'prop-types';
import { Price } from '@proton/components';
import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { c } from 'ttag';

const { MONTHLY, YEARLY } = CYCLE;

const MonthlyPrice = ({ plan, cycle, currency }) => {
    return (
        <Price className="h3 mb0" currency={currency} suffix={plan.Name === 'professional' ? '/mo/user' : '/mo'}>
            {plan.Pricing[cycle] / cycle}
        </Price>
    );
};

MonthlyPrice.propTypes = {
    plan: PropTypes.object,
    cycle: PropTypes.number,
    currency: PropTypes.string,
};

const BilledPrice = ({ plan, cycle, currency }) => {
    return (
        <Price key="planPrice" currency={currency} suffix={cycle === YEARLY ? '/year' : '/2-year'}>
            {plan.Pricing[cycle]}
        </Price>
    );
};

BilledPrice.propTypes = {
    plan: PropTypes.object,
    cycle: PropTypes.number,
    currency: PropTypes.string,
};

const PlanPrice = ({ cycle = DEFAULT_CYCLE, currency = DEFAULT_CURRENCY, planName, plans }) => {
    const plan = plans.find(({ Name }) => Name === planName);

    if (cycle === MONTHLY) {
        return <MonthlyPrice plan={plan} currency={currency} cycle={cycle} />;
    }

    const billedPrice = <BilledPrice key="billed" plan={plan} currency={currency} cycle={cycle} />;

    return (
        <>
            <div>
                <MonthlyPrice plan={plan} currency={currency} cycle={cycle} />
            </div>
            <small>{c('Info').jt`billed as ${billedPrice}`}</small>
        </>
    );
};

PlanPrice.propTypes = {
    plans: PropTypes.array,
    planName: PropTypes.string,
    cycle: PropTypes.number,
    currency: PropTypes.string,
};

export default PlanPrice;
