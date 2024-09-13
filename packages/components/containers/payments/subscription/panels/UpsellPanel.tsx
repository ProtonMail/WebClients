import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon, StripedItem, StripedList } from '@proton/components/components';
import { upgradeButtonClick } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useActiveBreakpoint } from '@proton/components/hooks';
import type { PLANS } from '@proton/shared/lib/constants';
import { CYCLE } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import type { ButtonColor, ButtonShape, UpsellCta, UpsellFeature } from '../helpers';
import { isUpsellCta } from '../helpers';
import Panel from './Panel';

import './UpsellPanel.scss';

export interface UpsellPanelProps {
    title: string;
    plan?: PLANS;
    children?: ReactNode;
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

const UpsellPanel = ({ title, plan, features, children, ctas = [], isRecommended }: UpsellPanelProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded((prev) => !prev);
    const { viewportWidth } = useActiveBreakpoint();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    return (
        <Panel className={clsx(isRecommended ? 'border-primary border-recommended' : 'border-strong')} title={title}>
            {/* `Recommended` label */}
            {isRecommended && (
                <label className="recommended-label absolute color-invert bg-primary rounded-full px-2 py-1 flex items-center">
                    <Icon name="star" className="mr-1" />
                    {c('upsell panel').t`Recommended`}
                </label>
            )}
            {children}

            {viewportWidth['<=small'] && (
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
                                size="large"
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
        </Panel>
    );
};

export default UpsellPanel;
