import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

const PlanCard = ({
    title,
    headerTrailing,
    description,
    features,
    footer,
    onCTAClick,
}: {
    title: ReactNode;
    headerTrailing: ReactNode;
    description: ReactNode;
    features: ReactNode;
    footer: ReactNode;
    onCTAClick: () => void;
}) => {
    return (
        <div className="w-full">
            <div className="fade-in">
                <header className="flex flex-row justify-space-between items-baseline gap-2">
                    <h3 className="text-bold text-xl mt-0 mb-2">{title}</h3>
                    {headerTrailing}
                </header>

                <p className="mb-6 text-lg">{description}</p>

                <ul className="unstyled m-0 flex flex-column gap-2 mb-6">{features}</ul>

                <div className="mb-4">{footer}</div>
            </div>

            <Button
                onClick={onCTAClick}
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                className="mt-2 py-4 text-semibold"
            >{c('Signup').t`Start free trial`}</Button>
        </div>
    );
};

export default PlanCard;
