import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export type VisionaryWarningModalOwnProps = { type: 'downgrade' | 'switch' | 'delete' };

interface Props extends Omit<PromptProps, 'children' | 'title' | 'buttons'>, VisionaryWarningModalOwnProps {
    onConfirm: () => void;
}

export const VisionaryWarningModal = ({ onConfirm, type, ...rest }: Props) => {
    const visionary = 'Visionary';
    const plan = 'visionary';
    return (
        <Prompt
            data-testid="confirm-loss-visionary"
            title={(() => {
                if (type === 'switch') {
                    return c('new_plans: title').t`Switch plans?`;
                }
                if (type === 'delete') {
                    return c('new_plans: title').t`Delete account?`;
                }
                if (type === 'downgrade') {
                    return c('new_plans: title').t`Downgrade account?`;
                }
                return '';
            })()}
            buttons={[
                <Button color="norm" onClick={rest.onClose}>
                    {(() => {
                        if (type === 'switch') {
                            return c('new_plans: action').t`Keep ${plan}`;
                        }
                        if (type === 'downgrade') {
                            return c('new_plans: action').t`Keep account`;
                        }
                        if (type === 'delete') {
                            return c('new_plans: action').t`Keep account`;
                        }
                        return '';
                    })()}
                </Button>,
                <Button
                    data-testid="confirm-loss-btn"
                    onClick={() => {
                        onConfirm();
                        rest.onClose?.();
                    }}
                >
                    {(() => {
                        if (type === 'switch') {
                            return c('new_plans: action').t`Switch plan`;
                        }
                        if (type === 'downgrade') {
                            return c('new_plans: action').t`Downgrade account`;
                        }
                        if (type === 'delete') {
                            return c('new_plans: action').t`Delete account`;
                        }
                        return '';
                    })()}
                </Button>,
            ]}
            {...rest}
        >
            {c('new_plans: info')
                .t`Our ${visionary} plan is no longer available to new subscribers as it is a special plan for original ${BRAND_NAME} users with special features and benefits.`}{' '}
            {(() => {
                if (type === 'switch') {
                    return c('new_plans: info')
                        .t`If you switch to a different plan, you lose all ${visionary} plan benefits and won’t be able to switch back to ${visionary}.`;
                }
                if (type === 'downgrade') {
                    return c('new_plans: info')
                        .t`If you downgrade your account, you lose all ${visionary} plan benefits and it won’t be available if you try to subscribe again.`;
                }
                if (type === 'delete') {
                    return c('new_plans: info')
                        .t`If you delete your account, you lose all ${visionary} plan benefits and it won’t be available if you create a new account.`;
                }
            })()}{' '}
            <Href href={getKnowledgeBaseUrl('/upgrading-to-new-proton-plan/#switch-from-visionary')}>{c('Info')
                .t`Learn more`}</Href>
        </Prompt>
    );
};

export type DiscountWarningProps = Props & { type: 'downgrade' | 'delete' };
export const DiscountWarningModal = ({ onConfirm, type, ...rest }: DiscountWarningProps) => {
    return (
        <Prompt
            title={(() => {
                if (type === 'delete') {
                    return c('new_plans: title').t`Delete account?`;
                }
                return c('new_plans: title').t`Downgrade account?`;
            })()}
            buttons={[
                <Button color="norm" onClick={rest.onClose}>
                    {(() => {
                        if (type === 'delete') {
                            return c('new_plans: action').t`Keep account`;
                        }
                        return c('new_plans: action').t`Keep account`;
                    })()}
                </Button>,
                <Button
                    onClick={() => {
                        onConfirm();
                        rest.onClose?.();
                    }}
                >
                    {(() => {
                        if (type === 'delete') {
                            return c('new_plans: action').t`Delete account`;
                        }
                        return c('new_plans: action').t`Downgrade account`;
                    })()}
                </Button>,
            ]}
            {...rest}
        >
            {(() => {
                if (type === 'delete') {
                    return c('new_plans: info')
                        .t`You’re enjoying a promotional price on your current plan. If you delete your account, you will lose your promotional price and it won’t be available if you create a new account.`;
                }
                return c('new_plans: info')
                    .t`You’re enjoying a promotional price on your current plan. If you downgrade your account, you will lose your promotional price and it won’t be available if you try to subscribe again.`;
            })()}
        </Prompt>
    );
};
