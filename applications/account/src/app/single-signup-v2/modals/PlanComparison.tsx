import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { IconSize } from '@proton/components';
import { DriveLogo, MailLogo, PassLogo, VpnLogo } from '@proton/components';
import {
    APPS,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    PLANS,
    PLAN_SERVICES,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Plan, PlansMap, SubscriptionPlan } from '@proton/shared/lib/interfaces';
import { CSS_BASE_UNIT_SIZE } from '@proton/styles';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import FreeLogo from '../FreeLogo';
import { getFreeTitle } from '../helper';

import './PlanComparison.scss';

const PlanItem = ({
    icon,
    title,
    selected = true,
    isLastSelected,
    bold,
}: {
    icon: ReactNode;
    title: string;
    bold?: boolean;
    selected?: Boolean;
    isLastSelected?: Boolean;
}) => {
    return (
        <li
            className={clsx(
                'text-sm flex gap-2 p-1 plan-comparison-item flex-nowrap',
                selected && 'plan-comparison-item--selected',
                isLastSelected && 'plan-comparison-item--selected-last'
            )}
        >
            {icon}
            <span className={clsx(bold && 'text-semibold', 'text-ellipsis')}>{title}</span>
        </li>
    );
};

interface Item {
    plan: PLANS;
    title: string;
    icon: ReactNode;
    selected: boolean;
    bold?: boolean;
    self?: boolean;
}

const getPaidMap = (plansMap: PlansMap, logoSize: IconSize): { [key in PLANS]?: Item } => {
    return {
        [PLANS.DRIVE]: {
            plan: PLANS.DRIVE,
            title: plansMap[PLANS.DRIVE]?.Title || '',
            icon: <DriveLogo variant="glyph-only" size={logoSize} />,
            selected: true,
            bold: false,
        },
        [PLANS.VPN]: {
            plan: PLANS.VPN,
            title: plansMap[PLANS.VPN]?.Title || '',
            icon: <VpnLogo variant="glyph-only" size={logoSize} />,
            selected: true,
            bold: false,
        },
        [PLANS.PASS]: {
            plan: PLANS.PASS,
            title: plansMap[PLANS.PASS]?.Title || '',
            icon: <PassLogo variant="glyph-only" size={logoSize} />,
            selected: true,
            bold: false,
        },
        [PLANS.MAIL]: {
            plan: PLANS.MAIL,
            title: plansMap[PLANS.MAIL]?.Title || '',
            icon: <MailLogo variant="glyph-only" size={logoSize} />,
            selected: true,
            bold: false,
        },
        [PLANS.MAIL_PRO]: {
            plan: PLANS.MAIL_PRO,
            title: plansMap[PLANS.MAIL_PRO]?.Title || '',
            icon: <MailLogo variant="glyph-only" size={logoSize} />,
            selected: true,
            bold: false,
        },
    };
};

interface Props {
    children: ReactNode;
    plansMap: PlansMap;
    upsellPlan: Plan | undefined;
    currentPlan: SubscriptionPlan | undefined;
    unlockPlan: Plan | undefined;
    dark: boolean;
}

const PlanComparison = ({ dark, currentPlan, upsellPlan, unlockPlan, children, plansMap }: Props) => {
    const iconSize: IconSize = 5;
    const iconImgSize = iconSize * CSS_BASE_UNIT_SIZE;
    const paidMap = getPaidMap(plansMap, iconSize);
    const upsellPlanTitle = upsellPlan?.Title || '';

    const left: Item[] = [
        currentPlan?.Name === PLANS.MAIL_PRO
            ? {
                  plan: PLANS.MAIL_PRO,
                  title: getFreeTitle(MAIL_SHORT_APP_NAME),
                  icon: <FreeLogo app={APPS.PROTONMAIL} size={iconImgSize} dark={dark} />,
                  selected: false,
                  bold: false,
                  service: PLAN_SERVICES.MAIL,
              }
            : {
                  plan: PLANS.MAIL,
                  title: getFreeTitle(MAIL_SHORT_APP_NAME),
                  icon: <FreeLogo app={APPS.PROTONMAIL} size={iconImgSize} dark={dark} />,
                  selected: false,
                  bold: false,
                  service: PLAN_SERVICES.MAIL,
              },
        {
            plan: PLANS.PASS,
            title: getFreeTitle(PASS_SHORT_APP_NAME),
            icon: <FreeLogo app={APPS.PROTONPASS} size={iconImgSize} dark={dark} />,
            selected: false,
            bold: false,
            service: PLAN_SERVICES.PASS,
        },
        {
            plan: PLANS.DRIVE,
            title: getFreeTitle(DRIVE_SHORT_APP_NAME),
            icon: <FreeLogo app={APPS.PROTONDRIVE} size={iconImgSize} dark={dark} />,
            selected: false,
            bold: false,
            service: PLAN_SERVICES.DRIVE,
        },
        {
            plan: PLANS.VPN,
            title: getFreeTitle(VPN_SHORT_APP_NAME),
            icon: <FreeLogo app={APPS.PROTONVPN_SETTINGS} size={iconImgSize} dark={dark} />,
            selected: false,
            bold: false,
            service: PLAN_SERVICES.VPN,
        },
    ]
        .map((item) => {
            if (hasBit(currentPlan?.Services as any, item.service)) {
                return {
                    ...item,
                    ...paidMap[item.plan],
                    bold: true,
                    self: true,
                };
            }
            return item;
        })
        .filter(isTruthy);

    const right = left
        .map((item): Item => {
            const paidItem = paidMap[item.plan];
            const self = item.self;
            if (paidItem && (self || unlockPlan?.Name === item.plan)) {
                return {
                    ...paidItem,
                    self,
                    bold: true,
                };
            }
            return paidItem || item;
        })
        .sort((a, b) => {
            return Number(b.self || 0) - Number(a.self || 0) || Number(b.bold || 0) - Number(a.bold || 0);
        });

    const sortedLeft = right
        .map((rightItem) => left.find((leftItem) => leftItem.plan === rightItem.plan))
        .filter(isTruthy);

    const getIsLastSelected = (item: { selected?: boolean }, index: number, list: { selected?: boolean }[]) => {
        return item.selected === true && (index === list.length - 1 || !(list[index + 1].selected === true));
    };

    return (
        <div className="border border-primary rounded-xl p-4 pb-2">
            <div className="flex gap-6 px-4">
                <div className="flex-1 text-center">
                    <div className="mb-3 mt-2 text-sm color-weak text-ellipsis">{c('Title').t`Your plan`}</div>
                    <ul className="unstyled w-full plan-comparison-list mt-0">
                        {sortedLeft.map((item, index, list) => {
                            return (
                                <PlanItem
                                    key={item.plan}
                                    icon={item.icon}
                                    bold={item.bold}
                                    title={item.title}
                                    selected={item.selected}
                                    isLastSelected={getIsLastSelected(item, index, list)}
                                />
                            );
                        })}
                    </ul>
                </div>
                <div className="flex-1 text-center">
                    <div className="mb-3 mt-2 text-sm color-weak text-ellipsis">
                        {c('pass_signup_2023: Title').t`${upsellPlanTitle} plan`}
                    </div>
                    <ul className="unstyled w-full plan-comparison-list mt-0">
                        {right.map((item, index, list) => {
                            return (
                                <PlanItem
                                    key={item.plan}
                                    icon={item.icon}
                                    bold={item.bold}
                                    title={item.title}
                                    selected={item.selected}
                                    isLastSelected={getIsLastSelected(item, index, list)}
                                />
                            );
                        })}
                    </ul>
                </div>
            </div>
            {children}
        </div>
    );
};
export default PlanComparison;
