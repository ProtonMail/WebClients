import { ReactNode } from 'react';

import { c } from 'ttag';

import { DriveLogo, MailLogo, PassLogo, VpnLogo } from '@proton/components/components';
import {
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    PLANS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { Plan, PlansMap } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { getFreeTitle } from '../helper';
import driveFree from '../logo/plan-drive-free.svg';
import mailFree from '../logo/plan-mail-free.svg';
import passFree from '../logo/plan-pass-free.svg';
import vpnFree from '../logo/plan-vpn-free.svg';

import './PlanComparison.scss';

const getFreeLogo = (src: string) => <img src={src} height="20" alt="" />;

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

const getPaidMap = (plansMap: PlansMap): { [key in PLANS]?: Item } => {
    return {
        [PLANS.DRIVE]: {
            plan: PLANS.DRIVE,
            title: plansMap[PLANS.DRIVE]?.Title || '',
            icon: <DriveLogo variant="glyph-only" size={20} />,
            selected: true,
            bold: false,
        },
        [PLANS.VPN]: {
            plan: PLANS.VPN,
            title: plansMap[PLANS.VPN]?.Title || '',
            icon: <VpnLogo variant="glyph-only" size={20} />,
            selected: true,
            bold: false,
        },
        [PLANS.PASS_PLUS]: {
            plan: PLANS.PASS_PLUS,
            title: plansMap[PLANS.PASS_PLUS]?.Title || '',
            icon: <PassLogo variant="glyph-only" size={20} />,
            selected: true,
            bold: false,
        },
        [PLANS.MAIL]: {
            plan: PLANS.MAIL,
            title: plansMap[PLANS.MAIL]?.Title || '',
            icon: <MailLogo variant="glyph-only" size={20} />,
            selected: true,
            bold: false,
        },
        [PLANS.MAIL_PRO]: {
            plan: PLANS.MAIL_PRO,
            title: plansMap[PLANS.MAIL_PRO]?.Title || '',
            icon: <MailLogo variant="glyph-only" size={20} />,
            selected: true,
            bold: false,
        },
    };
};

interface Props {
    children: ReactNode;
    plansMap: PlansMap;
    upsellPlan: Plan | undefined;
    currentPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
}

const PlanComparison = ({ currentPlan, upsellPlan, unlockPlan, children, plansMap }: Props) => {
    const paidMap = getPaidMap(plansMap);
    const upsellPlanTitle = upsellPlan?.Title || '';

    const left: Item[] = [
        currentPlan?.Name === PLANS.MAIL_PRO
            ? {
                  plan: PLANS.MAIL_PRO,
                  title: getFreeTitle(MAIL_SHORT_APP_NAME),
                  icon: getFreeLogo(mailFree),
                  selected: false,
                  bold: false,
              }
            : {
                  plan: PLANS.MAIL,
                  title: getFreeTitle(MAIL_SHORT_APP_NAME),
                  icon: getFreeLogo(mailFree),
                  selected: false,
                  bold: false,
              },
        {
            plan: PLANS.PASS_PLUS,
            title: getFreeTitle(PASS_SHORT_APP_NAME),
            icon: getFreeLogo(passFree),
            selected: false,
            bold: false,
        },
        {
            plan: PLANS.DRIVE,
            title: getFreeTitle(DRIVE_SHORT_APP_NAME),
            icon: getFreeLogo(driveFree),
            selected: false,
            bold: false,
        },
        {
            plan: PLANS.VPN,
            title: getFreeTitle(VPN_SHORT_APP_NAME),
            icon: getFreeLogo(vpnFree),
            selected: false,
            bold: false,
        },
    ]
        .map((item) => {
            if (item.plan === currentPlan?.Name) {
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
                <div className="flex-item-fluid text-center">
                    <div className="mb-3 mt-2 text-sm color-weak text-ellipsis">{c('Title').t`Your plan`}</div>
                    <ul className="unstyled w100 plan-comparison-list mt-0">
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
                <div className="flex-item-fluid text-center">
                    <div className="mb-3 mt-2 text-sm color-weak text-ellipsis">
                        {c('pass_signup_2023: Title').t`${upsellPlanTitle} plan`}
                    </div>
                    <ul className="unstyled w100 plan-comparison-list mt-0">
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
