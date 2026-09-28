import { c } from 'ttag';

import { PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';

interface Props extends ModalProps {
    subscription: Subscription;
}

const addonLineTitle = (title: string, quantity: number) => (quantity > 1 ? `${title} x ${quantity}` : title);

const SubscriptionBreakdownModal = ({ subscription, ...modalProps }: Props) => {
    const { Plans } = subscription;
    const mainPlan = Plans.find((plan) => plan.Type === PLAN_TYPES.PLAN);
    const addons = Plans.filter((plan) => plan.Type === PLAN_TYPES.ADDON);

    const planTitle = mainPlan?.Title;
    // translator: e.g. "Mail Essentials breakdown"
    const title = planTitle ? c('Title').t`${planTitle} breakdown` : c('Title').t`Subscription breakdown`;

    return (
        <ModalTwo size="small" {...modalProps}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <ul className="unstyled m-0">
                    {mainPlan && <li className="py-2">{addonLineTitle(mainPlan.Title, mainPlan.Quantity)}</li>}
                    {addons.map((addon) => (
                        <li key={addon.ID} className="py-2 border-top">
                            {addonLineTitle(addon.Title, addon.Quantity)}
                        </li>
                    ))}
                </ul>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SubscriptionBreakdownModal;
