import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

const PlanCard = ({
    planName,
    headerTrailing,
    header,
    description,
    features,
    footer,
    onCTAClick,
}: {
    planName: string;
    headerTrailing: ReactNode;
    header: ReactNode;
    description: ReactNode;
    features: ReactNode;
    footer: ReactNode;
    onCTAClick: () => void;
}) => {
    return (
        <div className="w-full flex flex-column">
            <header
                className="flex flex-row justify-space-between items-center gap-2 min-h-custom"
                style={{ '--min-h-custom': '2.25rem' }}
            >
                {header}
                {headerTrailing}
            </header>

            <p className="mt-4 mb-6 text-lg">{description}</p>

            <ul className="unstyled m-0 flex flex-column gap-2 mb-6">{features}</ul>

            <Button
                onClick={onCTAClick}
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                className="mt-2 py-4 text-semibold"
            >{c('Signup').t`Try ${planName} for free`}</Button>

            <div className="text-center mt-2">{footer}</div>
        </div>
    );
};

export default PlanCard;
