import type { FC, ReactNode } from 'react';

import Avatar from '@proton/atoms/Avatar/Avatar';
import { Icon } from '@proton/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

type Props = {
    actions?: ReactNode;
    email: string;
    name: string;
    organization?: string;
    plan?: UserPassPlan;
    planName?: string;
};

export const UserPanel: FC<Props> = ({ actions, email, name, organization, plan, planName }) => {
    const emailOnly = planName !== undefined;
    const avatar = (name || email)?.toUpperCase()?.[0];

    return (
        <div className={clsx('flex flex-nowrap gap-2 items-center text-sm', plan && isPaidPlan(plan) && 'ui-orange')}>
            <Avatar className="shrink-0">{avatar}</Avatar>
            <div className="text-left flex-1">
                <span className="color-norm block text-ellipsis">{emailOnly ? email : name}</span>
                {!emailOnly && <span className="color-weak block text-ellipsis">{email}</span>}

                {planName && (
                    <div
                        className="flex flex-nowrap gap-1 items-center text-sm text-ellipsis"
                        style={{ color: 'var(--interaction-norm)' }}
                    >
                        <Icon name="star" className="shrink-0" size={3} color="var(--interaction-norm)" />
                        <span className="text-ellipsis">
                            {planName}
                            {organization && ` · ${organization}`}
                        </span>
                        {plan === UserPassPlan.FREE && (
                            <>
                                {' · '}
                                <UpgradeButton
                                    upsellRef={UpsellRef.MENU}
                                    hideIcon
                                    inline
                                    style={{ pointerEvents: 'auto' }}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {actions && <div className="shrink-0">{actions}</div>}
        </div>
    );
};
