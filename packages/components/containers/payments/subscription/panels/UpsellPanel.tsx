import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, InlineLinkButton, StripedItem, StripedList } from '@proton/components/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { ButtonColor, ButtonShape, UpsellCta, UpsellFeature, isUpsellCta } from '../helpers';
import Panel from './Panel';

import './UpsellPanel.scss';

export interface UpsellPanelProps {
    title: string;
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

const UpsellPanel = ({ title, features, children, ctas = [], isRecommended }: UpsellPanelProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded((prev) => !prev);
    const { isNarrow } = useActiveBreakpoint();

    return (
        <Panel className={clsx(isRecommended ? 'border-primary border-recommended' : 'border-strong')} title={title}>
            {/* `Recommended` label */}
            {isRecommended && (
                <label className="recommended-label absolute color-invert bg-primary rounded-full px-2 py-1 flex flex-align-items-center">
                    <Icon name="star" className="mr-1" />
                    {c('upsell panel').t`Recommended`}
                </label>
            )}
            {children}

            {isNarrow && (
                <div className="w100 text-center my-6 flex">
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

            {(!isNarrow || isExpanded) && (
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
                                left={<Icon className={clsx(included && 'color-success')} size={20} name={icon} />}
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
                        return (
                            <Button
                                key={`upsell-action-${cta.label}`}
                                data-testid="upsell-cta"
                                size="large"
                                {...getButtonColorAndShape({ shape: cta.shape, color: cta.color, isRecommended })}
                                onClick={cta.action}
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
