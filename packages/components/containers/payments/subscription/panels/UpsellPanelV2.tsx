import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Icon from '@proton/components/components/icon/Icon';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import { upgradeButtonClick } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { CYCLE } from '@proton/payments';
import type { PLANS } from '@proton/payments';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import type { ButtonColor, ButtonShape, UpsellCta, UpsellFeature } from '../helpers';
import { isUpsellCta } from '../helpers';

import './UpsellPanelV2.scss';

export interface UpsellPanelProps {
    title: string;
    plan?: PLANS;
    children?: ReactNode;
    saveLabel?: ReactNode;
    features: UpsellFeature[];
    isRecommended?: boolean;
    ctas?: (UpsellCta | ReactNode)[];
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

const UpsellPanelV2 = ({ title, plan, features, children, ctas = [], isRecommended, saveLabel }: UpsellPanelProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded((prev) => !prev);
    const { viewportWidth } = useActiveBreakpoint();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    return (
        <div
            className={clsx(
                'UpsellPanelV2 w-full rounded-lg bg-norm p-4 relative border',
                isRecommended ? 'border-primary border-recommended' : 'border-transparent'
            )}
        >
            {/* `Recommended` label */}
            {isRecommended && (
                <label className="recommended-label absolute color-invert bg-primary rounded-lg text-semibold text-sm px-3 py-1 flex items-center">
                    {c('upsell panel').t`Best deal`}
                </label>
            )}
            <header className="mb-2">
                <h3 className="text-semibold m-0 text-lg">
                    {title}
                    {saveLabel}
                </h3>
            </header>
            {children}

            {viewportWidth['<=small'] && features.length > 0 && (
                <div className="w-full text-center my-6 flex">
                    <InlineLinkButton className="mx-auto" onClick={() => toggleExpand()}>
                        {isExpanded ? (
                            <>
                                <span>{c('Action').t`Hide plan features`}</span>
                                <Icon name="chevron-up" className="ml-2" />
                            </>
                        ) : (
                            <>
                                <span>{c('Action').t`See plan features`}</span>
                                <Icon name="chevron-down" className="ml-2" />
                            </>
                        )}
                    </InlineLinkButton>
                </div>
            )}

            {(!viewportWidth['<=small'] || isExpanded) && (
                <StripedList alternate="odd">
                    {features.map(({ icon = 'checkmark', text, tooltip, included = true, status = 'available' }) => {
                        if (!included) {
                            return null;
                        }

                        const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                        return (
                            <StripedItem
                                key={key}
                                className={clsx(status === 'coming-soon' && 'color-weak')}
                                left={<Icon className={clsx(included && 'color-success')} size={5} name={icon} />}
                                tooltip={tooltip}
                            >
                                {text}
                            </StripedItem>
                        );
                    })}
                </StripedList>
            )}

            <div className="flex column gap-4">
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
        </div>
    );
};

export default UpsellPanelV2;
