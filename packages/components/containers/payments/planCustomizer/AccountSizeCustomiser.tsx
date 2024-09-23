import type { ReactElement, ReactNode } from 'react';

import { c, msgid } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { contactHref } from './helpers';

export type AccountTypeKey = 'drive' | 'org-size' | 'users' | 'gpt-seats';
export type AccountSizeConfig = {
    [key in AccountTypeKey]: { label: string; tooltip?: string };
};

// Since ttag doesn't support ngettext with jt, we manually replace the string with a react node...
const getAccountSizeString = (maxUsers: number, price: ReactNode) => {
    // translator: This string is followed up by the string "Should you need more than ${maxUsers} user accounts, please <contact> our Sales team"
    const first = c('plan customizer, users')
        .jt`Select the number of users to include in your plan. Each additional user costs ${price}.`;

    const contact = '_TMPL_';

    const second = c('plan customizer, users').ngettext(
        msgid`Should you need more than ${maxUsers} user account, please ${contact} our Sales team.`,
        `Should you need more than ${maxUsers} user accounts, please ${contact} our Sales team.`,
        maxUsers
    );
    return [
        first,
        ' ',
        ...second
            .split(contact)
            .map((value, index, arr) => (index !== arr.length - 1 ? [value, contactHref] : [value])),
    ];
};

export const AccountSizeCustomiser = ({
    addon,
    maxUsers,
    price,
    input,
    showDescription = true,
    showTooltip = true,
    mode,
    value,
}: {
    addon: Plan;
    maxUsers: number;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
    showTooltip?: boolean;
    mode: AccountTypeKey;
    value: number;
}) => {
    const n = value;
    const config: AccountSizeConfig = {
        drive: {
            label: c('Info').ngettext(
                msgid`Create a secure cloud for ${n} member`,
                `Create a secure cloud for ${n} members`,
                n
            ),
        },
        'org-size': {
            label: c('Info').t`Organization size`,
        },
        users: {
            label: c('Info').t`Users`,
            tooltip: c('Info').t`A user is an account associated with a single username, mailbox, and person`,
        },
        'gpt-seats': {
            label: c('Info').t`${BRAND_NAME} Scribe writing assistant`,
            tooltip: c('Infog').t`AI powered assistant to help you craft better emails, quickly and effortlessly.`,
        },
    };

    return (
        <div className={clsx(showDescription ? 'mb-8' : 'mb-4')}>
            {showDescription && mode === 'users' && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{c('Info').t`Account size`}</h2>
                    <div className="mb-4">{getAccountSizeString(maxUsers, price)}</div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {config[mode].label}
                    {showTooltip && config[mode]?.tooltip && <Info buttonClass="ml-2" title={config[mode].tooltip} />}
                </label>
                {input}
            </div>
        </div>
    );
};
