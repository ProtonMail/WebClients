import type { ReactElement } from 'react';

import { c, msgid } from 'ttag';

import Info from '@proton/components/components/link/Info';
import type { Plan } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { contactHref } from './helpers';

export const IPsNumberCustomiser = ({
    addon,
    maxIPs,
    price,
    input,
    showDescription = true,
}: {
    addon: Plan;
    maxIPs: number;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
}) => {
    const title = c('Info').t`Dedicated servers`;

    const select = c('plan customizer, ips')
        .jt`Select the number of IPs to include in your plan. Each additional IP costs ${price}.`;

    // translator: the plural is based on maxIPs variable (number written in digits). This string is part of another one, full sentence is: Should you need more than <maxIPs> IPs, (please <contact> our Sales team).
    const description = c('plan customizer, ips').ngettext(
        msgid`Should you need more than ${maxIPs} IP, `,
        `Should you need more than ${maxIPs} IPs, `,
        maxIPs
    );

    // translator: this string is part of another one, full sentence is: (Should you need more than <maxIPs> IPs, )please <contact> our Sales team.
    const pleaseContact = c('plan customizer, ips').jt`please ${contactHref} our Sales team.`;

    return (
        <div className={clsx(showDescription ? 'mb-8' : 'mb-4')}>
            {showDescription && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{title}</h2>
                    <div className="mb-4">
                        {select}
                        {description}
                        {pleaseContact}
                    </div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {title}
                    <Info buttonClass="ml-2" title={c('Info').t`Number of dedicated servers in the organization`} />
                </label>
                {input}
            </div>
        </div>
    );
};
