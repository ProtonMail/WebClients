import { useUser } from '@proton/account/user/hooks';
import useOneDollarPromo from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { type CYCLE, PLANS } from '@proton/payments';

interface Props {
    upsellRef: string;
    cycle?: CYCLE;
    preventInApp?: boolean;
}

/**
 * This hook ensure  that we upsell the user to the right plan based on his current subscription
 * @param upsellRef reference of the upsell
 * @returns configuration of the upsell modal
 */
export const useMailUpsellConfig = ({ upsellRef, preventInApp = false, cycle }: Props) => {
    const [user] = useUser();

    const {
        submitText: oneDollarConfigSubmitText,
        footerText: oneDollarConfigFooterText,
        cycle: oneDollarConfigCycle,
        planIDs: oneDollarConfigPlanIDs,
        ...oneDollarConfigRest
    } = useOneDollarPromo();

    const upsellConfig = useUpsellConfig({
        upsellRef,
        preventInApp,
        plan: user.isPaid ? PLANS.BUNDLE : PLANS.MAIL,
        ...oneDollarConfigRest,
        cycle: cycle || oneDollarConfigCycle,
    });

    return {
        upsellConfig: {
            ...upsellConfig,
            submitText: oneDollarConfigSubmitText,
            footerText: oneDollarConfigFooterText,
            planIDs: oneDollarConfigPlanIDs,
        },
    };
};
