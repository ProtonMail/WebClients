import { c } from 'ttag';

import { IcTag } from '@proton/icons';

import './DiscountBanner.scss';

interface Props {
    discountPercent: number;
    selectedPlanTitle: string;
}

const DiscountBanner = ({ discountPercent, selectedPlanTitle }: Props) => {
    const boldDiscountPercent = (
        <b key="bold-discount-percent">{
            // full sentence: Your 10% discount to Proton Pass has been applied
            c('Info').t`${discountPercent}% discount`
        }</b>
    );
    const boldPlanTitle = <b key="bold-plan-title">{selectedPlanTitle}</b>;

    return (
        <div className="single-signup-discount-banner flex-nowrap mt-4 text-lg rounded px-4 py-2 flex gap-2">
            <div className="shrink-0 flex items-center">
                <IcTag size={4} />
            </div>

            <span className="text-center">
                {
                    // full sentence: Your 10% discount to Proton Pass has been applied
                    c('Info').jt`Your ${boldDiscountPercent} to ${boldPlanTitle} has been applied`
                }
            </span>
        </div>
    );
};

export default DiscountBanner;
