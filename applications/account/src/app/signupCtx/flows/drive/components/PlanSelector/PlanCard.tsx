import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCheckmark } from '@proton/icons';
import clsx from '@proton/utils/clsx';

export enum PlanCardBorderVariant {
    Plain,
    Upsell,
}

const PlanCard = ({
    title,
    description,
    ctaCopy,
    features,
    selected,
    highlighted,
    highlightVariant = PlanCardBorderVariant.Upsell,
    highlightTitle,
    pricing,
    onCTAClick,
}: {
    title: ReactNode;
    description: ReactNode;
    ctaCopy: ReactNode;
    features?: ReactNode;

    /**
     * Changes cta button text and disables button
     */
    selected: boolean;

    /**
     * Adds a highlight border and title to the card
     */
    highlighted: boolean;
    highlightVariant?: PlanCardBorderVariant;
    highlightTitle: string;
    pricing: ReactNode;
    onCTAClick: () => void;
}) => {
    return (
        <div
            className={clsx(
                'drive-signup-plan-card w-full p-6 max-w-custom relative',
                highlighted && 'drive-signup-plan-card-highlighted',
                highlighted &&
                    highlightVariant === PlanCardBorderVariant.Plain &&
                    'drive-signup-plan-card-highlighted--default'
            )}
            style={{ '--max-w-custom': '25rem' }}
        >
            {highlighted ? (
                <span className="drive-signup-plan-card-label p-2 text-center text-semibold">{highlightTitle}</span>
            ) : undefined}

            <h3 className="text-bold text-xl mt-0 mb-2">{title}</h3>
            <div className="min-h-custom mb-4" style={{ '--min-h-custom': '4rem' }}>
                <p>{description}</p>
            </div>

            {pricing}

            <Button
                fullWidth
                pill
                color="norm"
                size="large"
                shape={selected || highlighted ? 'solid' : 'outline'}
                onClick={onCTAClick}
                disabled={selected}
                className="items-center flex gap-2 justify-center"
            >
                {selected && <IcCheckmark size={5} />}
                {selected ? c('Signup').t`Selected` : ctaCopy}
            </Button>

            <hr className="my-5 bg-weak" />

            {features ? <ul className="unstyled m-0 flex flex-column gap-1">{features}</ul> : undefined}
        </div>
    );
};

export default PlanCard;
