import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { upgradeButtonClick } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import type { PLANS } from '@proton/payments';
import { CYCLE } from '@proton/payments';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import type { ButtonColor, ButtonShape, UpsellCta, UpsellFeature } from '../helpers';
import { isUpsellCta } from '../helpers';

import './UpsellPanelV2.scss';

export interface UpsellPanelProps {
    title: string;
    plan?: PLANS;
    icon?: ReactNode;
    children?: ReactNode;
    saveLabel?: ReactNode;
    features: UpsellFeature[];
    isRecommended?: boolean;
    recommendedLabel?: string;
    ctas?: (UpsellCta | ReactNode)[];
    /** Top vertical fade; color stop at 0%, transparent at 100% (see `CurrentPlanInfoSection` `PlanCard`). */
    gradientColor?: string;
}

type GetButtonColorAndShape = (opt: Pick<UpsellCta, 'color' | 'shape'> & Pick<UpsellPanelProps, 'isRecommended'>) => {
    shape?: ButtonShape;
    color?: ButtonColor;
};
const getButtonColorAndShape: GetButtonColorAndShape = ({ color, shape, isRecommended }) => {
    // If button has another shape, then with don't want to compell a color on `recommended` state
    if (!isRecommended || (shape && !['solid', 'outline'].includes(shape))) {
        return { color, shape };
    }

    return { color: 'norm', shape: 'solid' };
};

const UpsellPanelV2 = ({
    title,
    plan,
    icon,
    features,
    children,
    ctas = [],
    isRecommended,
    recommendedLabel,
    saveLabel,
    gradientColor,
}: UpsellPanelProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded((prev) => !prev);
    const { viewportWidth } = useActiveBreakpoint();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    const panelHead = (
        <>
            {icon && <div className="mb-3">{icon}</div>}
            <header className="mb-2">
                <h3 className="text-semibold m-0 text-lg">
                    {title}
                    {saveLabel}
                </h3>
            </header>
            {children}

            <div className="flex column gap-4 mt-2">
                {ctas.map((cta) => {
                    if (isUpsellCta(cta)) {
                        const handleOnClick = () => {
                            // Open the link in browser on Electron unless it is supported
                            if (isElectronApp && !hasInboxDesktopInAppPayments) {
                                upgradeButtonClick(CYCLE.YEARLY, plan);
                            } else {
                                cta.action();
                            }
                        };

                        return (
                            <Button
                                key={`upsell-action-${cta.label}`}
                                data-testid="upsell-cta"
                                {...getButtonColorAndShape({ shape: cta.shape, color: cta.color, isRecommended })}
                                onClick={handleOnClick}
                                fullWidth
                            >
                                {cta.label}
                            </Button>
                        );
                    }

                    return cta;
                })}
            </div>
        </>
    );

    return (
        <div
            className={clsx(
                'UpsellPanelV2 w-full rounded-lg bg-norm relative border',
                gradientColor ? 'p-2' : 'p-4',
                isRecommended ? 'border-primary border-recommended' : 'border-transparent'
            )}
        >
            {isRecommended && (
                <label className="recommended-label absolute color-invert bg-primary rounded-lg text-semibold text-sm px-3 py-1 flex items-center">
                    {recommendedLabel ?? c('upsell panel').t`Best deal`}
                </label>
            )}

            {gradientColor ? (
                <div
                    className="rounded p-2"
                    style={{
                        background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`,
                    }}
                >
                    {panelHead}
                </div>
            ) : (
                panelHead
            )}

            {viewportWidth['<=small'] && features.length > 0 && (
                <div className="w-full text-center my-6 flex">
                    <InlineLinkButton className="mx-auto" onClick={() => toggleExpand()}>
                        {isExpanded ? (
                            <>
                                <span>{c('Action').t`Hide plan features`}</span>
                                <IcChevronUp className="ml-2" />
                            </>
                        ) : (
                            <>
                                <span>{c('Action').t`See plan features`}</span>
                                <IcChevronDown className="ml-2" />
                            </>
                        )}
                    </InlineLinkButton>
                </div>
            )}

            {(!viewportWidth['<=small'] || isExpanded) && features.length > 0 && (
                <ul
                    className={clsx(
                        'unstyled p-0 mt-0 md:mt-6 mb-0 flex flex-column gap-2 md:gap-4',
                        gradientColor ? 'p-2' : 'p-4'
                    )}
                >
                    {features.map(({ icon = 'checkmark', text, tooltip, included = true, status = 'available' }) => {
                        if (!included) {
                            return null;
                        }

                        const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                        return (
                            <li
                                key={key}
                                className={clsx(status === 'coming-soon' && 'color-weak', 'flex items-center gap-2')}
                            >
                                <Icon className={clsx(included && 'color-success')} size={5} name={icon} />
                                <span>{text}</span>
                                {tooltip && <Info title={tooltip} />}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default UpsellPanelV2;
