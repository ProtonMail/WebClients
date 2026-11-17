import type { ReactNode } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { IcBoltFilled } from '@proton/icons/icons/IcBoltFilled';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { PLANS } from '@proton/payments/core/constants';
import clsx from '@proton/utils/clsx';

import Info from '../../../../../../components/link/Info';
import CustomLogo from '../../CustomLogo';
import visionaryLogo from '../../logo/plan-visionary-gold.svg';

import './ExclusivePlanBorder.scss';
import './PlanOfferCard.scss';

export interface PlanOfferFeature {
    id: string;
    text: ReactNode;
    tooltip?: string;
}

export type PlanOfferPlanName = PLANS.VISIONARY | PLANS.BUNDLE | PLANS.DUO | PLANS.FAMILY;

export const PlanOfferLogo = ({ planName }: { planName: PlanOfferPlanName }) => {
    if (planName === PLANS.VISIONARY) {
        return <img src={visionaryLogo} width={44} height={44} alt="" className="PlanOfferCard-logo shrink-0" />;
    }
    return (
        <div className="PlanOfferCard-logo PlanOfferCard-logo-tile shrink-0 flex" aria-hidden="true">
            <CustomLogo planName={planName} size={32} />
        </div>
    );
};

const headerLayoutClassName = {
    full: 'flex-column',
    compact: 'flex-row items-start',
    solo: 'flex-row items-start md:flex-1',
};

interface Props {
    planName: PlanOfferPlanName;
    title: ReactNode;
    description: ReactNode;
    /**
     * - `full`: checklist and full-width button
     * - `compact`: one line and full-width button
     * - `solo`: compact, alone at full width with the button on the right
     */
    variant: 'full' | 'compact' | 'solo';
    featuresIntro?: ReactNode;
    features?: PlanOfferFeature[];
    /** Extra line under the description, highlighted */
    highlightLine?: ReactNode;
    /** Band across the top of the card, with a gradient border */
    band?: ReactNode;
    /** Keeps the space of a band, so the card lines up with a banded card next to it */
    reserveBandSpace?: boolean;
    ctaLabel: ReactNode;
    onCta: () => void;
    loading?: boolean;
    'data-testid'?: string;
}

const PlanOfferCard = ({
    planName,
    title,
    description,
    variant,
    featuresIntro,
    features,
    highlightLine,
    band,
    reserveBandSpace = false,
    ctaLabel,
    onCta,
    loading,
    'data-testid': dataTestId,
}: Props) => {
    const isSolo = variant === 'solo';
    const isFull = variant === 'full';

    return (
        <div
            className={clsx(
                'PlanOfferCard bg-elevated rounded-xl shadow-norm flex flex-column flex-nowrap w-full md:flex-1 overflow-hidden',
                !!band && 'exclusive-plan-border'
            )}
            data-testid={dataTestId}
        >
            {band && <div className="bg-primary text-center text-sm text-semibold py-1 px-4">{band}</div>}
            {!band && reserveBandSpace && (
                <div className="hidden md:block visibility-hidden text-sm py-1 px-4" aria-hidden="true">
                    &nbsp;
                </div>
            )}
            <div
                className={clsx(
                    'flex flex-nowrap grow',
                    isSolo ? 'flex-column md:flex-row md:items-center gap-4 p-4 md:p-6' : 'flex-column gap-4 p-6'
                )}
            >
                <div className={clsx('flex flex-nowrap gap-3', headerLayoutClassName[variant])}>
                    <PlanOfferLogo planName={planName} />
                    <div className="flex flex-column">
                        <span className={clsx('text-semibold', isFull ? 'text-2xl' : 'text-lg')}>{title}</span>
                        <span className="color-weak">{description}</span>
                        {highlightLine && (
                            <span className="mt-2 flex flex-nowrap items-center gap-2 text-semibold color-primary">
                                <IcBoltFilled className="shrink-0" />
                                {highlightLine}
                            </span>
                        )}
                    </div>
                </div>
                {isFull && features && (
                    <div>
                        {featuresIntro && <p className="m-0 mb-2 text-semibold">{featuresIntro}</p>}
                        <ul className="unstyled m-0 flex flex-column gap-2">
                            {features.map((feature) => (
                                <li key={feature.id} className="m-0 flex flex-nowrap items-center gap-2">
                                    <IcCheckmark className="shrink-0 color-success" />
                                    <span>
                                        {feature.text}
                                        {feature.tooltip && <Info title={feature.tooltip} className="ml-1" />}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <Button
                    color="norm"
                    shape="outline"
                    size={isFull ? 'large' : undefined}
                    className={clsx(isSolo ? 'w-full md:w-auto shrink-0' : 'w-full mt-auto')}
                    loading={loading}
                    onClick={onCta}
                >
                    {ctaLabel}
                </Button>
            </div>
        </div>
    );
};

export default PlanOfferCard;
