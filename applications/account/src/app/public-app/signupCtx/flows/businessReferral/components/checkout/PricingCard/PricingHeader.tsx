import type { ReactNode } from 'react';

import { c } from 'ttag';

import SaveLabel from '../../../../../../single-signup-v2/SaveLabel';

interface Props {
    planTitle: string;
    icon?: ReactNode;
    discountPercent?: number;
}

export const PricingHeader = ({ planTitle, icon, discountPercent }: Props) => {
    return (
        <div className="flex flex-column gap-2 mb-6">
            <p className="m-0 text-sm color-weak">{c('Signup').t`Summary`}</p>
            <div className="flex flex-nowrap gap-2 items-center">
                <div
                    className="w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-primary shadow-raised"
                    style={{ '--w-custom': '2.5rem', backgroundColor: 'var(--plan-logo-shape-background, white)' }}
                    aria-hidden="true"
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <span className="text-semibold" data-testid="planName">
                        {planTitle}
                    </span>
                    <div className="flex items-center gap-1 text-sm color-weak">
                        <span>{c('Signup').t`Billed yearly`}</span>
                        {!!discountPercent && <SaveLabel percent={discountPercent} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
