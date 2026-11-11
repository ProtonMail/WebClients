import { useMemo, useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import type { PlanIDs } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import { BusinessPlanIcon } from './BusinessPlanIcon';
import type { BusinessPlanConfig } from './PlanCard';
import PlanCard from './PlanCard';

import './PlanSelector.scss';

type Plan = BusinessPlanConfig['plan'];

interface Props {
    plans: BusinessPlanConfig[];
}

enum CarouselDirection {
    Prev = 'prev',
    Next = 'next',
    Fade = 'fade',
}

const getAdjacentPlan = (
    displayOrder: Plan[],
    current: string,
    direction: Exclude<CarouselDirection, CarouselDirection.Fade>
): Plan => {
    const currentIndex = displayOrder.indexOf(current as Plan);
    const offset = direction === CarouselDirection.Next ? 1 : -1;
    const nextIndex = (currentIndex + offset + displayOrder.length) % displayOrder.length;
    return displayOrder[nextIndex];
};

const CarouselButton = ({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) => {
    const ChevronIcon = direction === 'left' ? IcChevronLeft : IcChevronRight;
    return (
        <Button
            shape="outline"
            size="medium"
            icon
            pill
            className={clsx(
                'BusinessPlanSelector-carouselButton absolute hidden lg:block rtl:mirror',
                `BusinessPlanSelector-carouselButton--${direction}`
            )}
            onClick={onClick}
        >
            <ChevronIcon size={8} className="color-primary" />
        </Button>
    );
};

const PlanSelector = ({ plans }: Props) => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const displayOrder = useMemo(() => plans.map((entry) => entry.plan), [plans]);

    const isSelected = (plan: Plan) => selectedPlan.name === plan;

    const [cardAnimation, setCardAnimation] = useState<CarouselDirection | null>();

    const handlePlanClick = (plan: Plan, direction: CarouselDirection = CarouselDirection.Fade) => {
        setCardAnimation(direction);
        const planIDs: PlanIDs = { [plan]: 1 };
        void payments.selectPlan({ planIDs });
    };

    const handlePrev = () => {
        handlePlanClick(
            getAdjacentPlan(displayOrder, selectedPlan.name, CarouselDirection.Prev),
            CarouselDirection.Prev
        );
    };

    const handleNext = () => {
        handlePlanClick(
            getAdjacentPlan(displayOrder, selectedPlan.name, CarouselDirection.Next),
            CarouselDirection.Next
        );
    };

    const selectedConfig = plans.find((entry) => isSelected(entry.plan));

    return (
        <div>
            <div id="plans" className="BusinessPlanSelector-iconsScroller flex px-4 pt-3 pb-8 overflow-x-auto">
                <div className="flex items-start mx-auto shrink-0">
                    {plans.map((entry) => (
                        <BusinessPlanIcon
                            key={entry.plan}
                            icon={entry.icon}
                            plan={entry.plan}
                            selected={isSelected(entry.plan)}
                            handleClick={handlePlanClick}
                            title={entry.iconTitle}
                        />
                    ))}
                </div>
            </div>
            <div
                key={cardAnimation ? selectedPlan.name : undefined}
                id="plans-cards"
                className={clsx(
                    'BusinessPlanSelector-carouselContainer',
                    cardAnimation &&
                        `BusinessPlanSelector-carouselContainer--animate BusinessPlanSelector-carouselContainer--animate-${cardAnimation}`,
                    'w-full relative mx-auto max-w-custom lg:max-w-custom flex justify-center items-center flex-nowrap gap-8'
                )}
                style={{ '--max-w-custom': '28rem', '--lg-max-w-custom': '54rem' }}
                onAnimationEnd={() => setCardAnimation(null)}
            >
                <CarouselButton direction="left" onClick={handlePrev} />
                <div className="BusinessPlanSelector-carouselItem BusinessPlanSelector-carouselItem--left hidden lg:block grow-0 shrink-0 rounded-xl" />
                <div
                    className="BusinessPlanSelector-planCard z-1 relative w-custom max-w-custom mx-auto flex flex-column md:flex-row flex-nowrap border border-weak bg-norm p-4 lg:p-8"
                    style={{ '--max-w-custom': 'calc(100vw - var(--space-4) - var(--space-4))', '--w-custom': '26rem' }}
                >
                    {selectedConfig && <PlanCard config={selectedConfig} />}
                </div>
                <div className="BusinessPlanSelector-carouselItem BusinessPlanSelector-carouselItem--right hidden lg:block grow-0 shrink-0 rounded-xl" />
                <CarouselButton direction="right" onClick={handleNext} />
            </div>
        </div>
    );
};

export default PlanSelector;
