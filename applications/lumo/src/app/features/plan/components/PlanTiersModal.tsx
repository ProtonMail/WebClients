import type { ReactNode } from 'react';
import { useContext, useId, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Loader } from '@proton/atoms/Loader/Loader';
import Modal, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { PLAN_NAMES } from '@proton/payments/core/constants';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCat from '@proton/styles/assets/img/lumo/lumo-cat-happy.svg';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import type { PlanTierCardProps } from './PlanTierCard';
import { PlanTierCard } from './PlanTierCard';
import { PlanTierTabs } from './PlanTierTabs';
import type { BillingCycle } from './utils';
import { getLumoSavingsLabel } from './utils';

import './PlanTiersModal.scss';

interface PlanTierOption extends Pick<PlanTierCardProps, 'tier' | 'title' | 'price' | 'variant' | 'action'> {
    /** Includes this paid plan in the compact radio group. Defaults to false. */
    selectable?: boolean;
    /** Yearly savings percentage for the billing toggle, including when Monthly is active. */
    yearlySavings?: number;
}

export interface PlanTiersModalProps {
    /** Visibility and lifecycle callbacks for Proton's shared modal. */
    modalProps: ModalStateProps;
    /** Plans for the selected billing period, with the current plan first when present. */
    cards: readonly PlanTierOption[];
    /** Billing period shown in the tabs and cards. */
    cycle: BillingCycle;
    /** Requests another billing period. The caller supplies the corresponding cards. */
    onCycleChange: (cycle: BillingCycle) => void;
    /** Controls the loading, retry, and ready views. Defaults to ready. */
    status?: 'loading' | 'error' | 'ready';
    /** Retries loading the options. Omit to hide the retry button. */
    onRetry?: () => void;
    /** Shows progress on the compact primary action and disables desktop actions. Defaults to false. */
    actionLoading?: boolean;
    /** Localized billing disclosure shown below the compact action. */
    disclosure?: ReactNode;
}

const PlanTiersHeader = () => {
    const { id } = useContext(ModalContext);
    return (
        <header className="lumo-plan-tiers-modal__header text-center">
            <img src={lumoCat} width={40} height={40} alt="" className="block mx-auto mb-1" />
            <h2 id={id} className="m-0 lumo-headline-small">
                {c('collider_2025:Title').t`Choose your plan`}
            </h2>
            <p id={`${id}-description`} className="mt-1 mb-0 lumo-body-large lumo-color-glyph-mid">
                {
                    // translator: Plan picker subtitle. ${LUMO_SHORT_APP_NAME} is the product name.
                    c('collider_2025:Info').t`Pick the plan that fits how you use ${LUMO_SHORT_APP_NAME}.`
                }
            </p>
        </header>
    );
};

/** Presents plan options and forwards billing-period changes and plan actions to the caller. */
export const PlanTiersModal = ({
    modalProps,
    cards,
    cycle,
    onCycleChange,
    status = 'ready',
    onRetry,
    actionLoading = false,
    disclosure,
}: PlanTiersModalProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const groupId = useId();
    const [selectedTier, setSelectedTier] = useState<LumoTierPlan>();
    const current = cards.find(({ variant }) => variant === 'current');
    const recommended = cards.find(({ variant }) => variant === 'recommended');
    const selectableCards = cards.filter(({ tier, selectable }) => tier && selectable);
    // Keep a user's choice across billing cycles when that tier is still offered.
    const selected =
        selectableCards.find(({ tier }) => tier === selectedTier) ??
        selectableCards.find(({ variant }) => variant === 'recommended') ??
        selectableCards[0];
    const savings = (isSmallScreen ? selected : recommended)?.yearlySavings;
    const savingsLabel = savings ? getLumoSavingsLabel(savings) : undefined;

    return (
        <Modal
            {...modalProps}
            size="xlarge"
            rootClassName="lumo-plan-tiers-modal-backdrop"
            className={clsx(
                'lumo-plan-tiers-modal',
                (status !== 'ready' || cards.length <= 1) && 'lumo-plan-tiers-modal--single',
                status === 'ready' && cards.length === 4 && 'lumo-plan-tiers-modal--four-plans'
            )}
        >
            <ModalHeaderCloseButton buttonProps={{ className: 'lumo-plan-tiers-modal__close absolute' }} />
            <div className="lumo-plan-tiers-modal__body flex flex-column flex-nowrap min-h-0 overflow-auto">
                <PlanTiersHeader />
                {status === 'error' ? (
                    <div className="flex flex-column items-center gap-3 px-6 py-8 text-center">
                        <p className="m-0 lumo-body-medium">{c('collider_2025:Error').t`Unable to load plans.`}</p>
                        {onRetry && <Button onClick={onRetry}>{c('collider_2025:Action').t`Try again`}</Button>}
                    </div>
                ) : (
                    <PlanTierTabs value={cycle} onChange={onCycleChange} savingsLabel={savingsLabel}>
                        {status === 'loading' ? (
                            <Loader className="mx-auto px-6 py-8" />
                        ) : (
                            <>
                                {selectableCards.length === 0 && (
                                    <p className="mx-4 mt-0 mb-3 lumo-body-medium text-center" aria-live="polite">
                                        {c('collider_2025:Error').t`Paid plans are currently unavailable.`}
                                    </p>
                                )}

                                {/* Desktop cards each have their own action. */}
                                <div className="lumo-plan-tiers-modal__plans px-6">
                                    {cards.map(({ tier, title, price, variant, action }) => (
                                        <PlanTierCard
                                            key={tier ?? 'free'}
                                            tier={tier}
                                            title={title}
                                            price={price}
                                            variant={variant}
                                            action={
                                                action && {
                                                    ...action,
                                                    disabled: actionLoading || action.disabled,
                                                }
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Compact cards share a single action below the scrolling body. */}
                                <div className="lumo-plan-tiers-modal__compact px-4 pb-3">
                                    {current?.tier && (
                                        <Card
                                            background={false}
                                            padded={false}
                                            className="flex flex-wrap items-center justify-space-between gap-2 mb-2 px-4 py-3 radius-16 lumo-border-mid"
                                        >
                                            <span className="lumo-title-small">
                                                {current.title ?? PLAN_NAMES[current.tier]}
                                            </span>
                                            <span className="px-2 radius-full lumo-label-small lumo-color-glyph-mid lumo-bg-control-fill">
                                                {c('collider_2025:Label').t`Current plan`}
                                            </span>
                                        </Card>
                                    )}
                                    {selectableCards.length > 0 && (
                                        <fieldset className="flex flex-column gap-2 min-w-0 m-0 p-0 border-none">
                                            <legend className="sr-only">
                                                {c('collider_2025:Title').t`Choose your plan`}
                                            </legend>
                                            {selectableCards.map(({ tier, title, price, variant }) => (
                                                <PlanTierCard
                                                    key={tier}
                                                    tier={tier}
                                                    compact
                                                    title={title}
                                                    price={price}
                                                    variant={variant}
                                                    groupId={groupId}
                                                    selected={selected?.tier === tier}
                                                    onSelect={() => setSelectedTier(tier)}
                                                />
                                            ))}
                                        </fieldset>
                                    )}
                                </div>
                            </>
                        )}
                    </PlanTierTabs>
                )}
            </div>

            {/* Keep the compact action visible while the plan list scrolls. */}
            {status === 'ready' && selected?.action && (
                <footer className="lumo-plan-tiers-modal__footer flex-column shrink-0 gap-3 px-4 pt-3 pb-5 text-center">
                    <Button
                        color="norm"
                        fullWidth
                        loading={actionLoading}
                        disabled={selected.action.disabled || !selected.action.onClick}
                        onClick={selected.action.onClick}
                    >
                        {selected.action.label}
                    </Button>
                    {disclosure && <p className="m-0 lumo-body-small text-break lumo-color-glyph-mid">{disclosure}</p>}
                </footer>
            )}
        </Modal>
    );
};
