import { useUser } from '@proton/account/user/hooks';
import useOneDollarPromo from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { type CYCLE, PLANS } from '@proton/payments';
import { useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';

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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();
    const oneDollarConfig = useOneDollarPromo({ newUpsellModalVariant: displayNewUpsellModalsVariant });

    const finalCycle = cycle ?? oneDollarConfig?.cycle;
    const upsellConfig = useUpsellConfig({
        upsellRef,
        preventInApp,
        plan: user.isPaid ? PLANS.BUNDLE : PLANS.MAIL,
        ...oneDollarConfig,
        cycle: finalCycle,
    });

    return { upsellConfig, displayNewUpsellModalsVariant };
};
