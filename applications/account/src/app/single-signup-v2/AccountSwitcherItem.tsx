import type { ElementType, ReactNode } from 'react';
import { forwardRef } from 'react';

import { Avatar } from '@proton/atoms';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

export interface UserItem {
    DisplayName?: string;
    Name?: string;
    Email?: string;
}

interface OwnProps {
    user: UserItem;
    right?: ReactNode;
    border?: boolean;
}

export type Props<E extends ElementType> = PolymorphicPropsWithRef<OwnProps, E>;

const defaultElement = 'div';

const AccountSwitcherItemBase = <E extends ElementType = typeof defaultElement>(
    { user, right, as, className, border = true, ...rest }: Props<E>,
    ref: typeof rest.ref
) => {
    const nameToDisplay = user.DisplayName || user.Name || user.Email || '';
    const initials = getInitials(nameToDisplay);
    const email = user.Email;

    const Element: ElementType = as || defaultElement;

    return (
        <Element
            className={clsx('text-left p-4 rounded-lg bg-norm', border && 'border', className)}
            {...rest}
            ref={ref}
        >
            <div className="flex gap-4 justify-space-between items-center">
                <div className="flex gap-4 items-center">
                    <Avatar>{initials}</Avatar>
                    <div className="flex flex-column">
                        <div className="text-break">
                            <strong>{nameToDisplay}</strong>
                        </div>
                        {email && <div className="text-break color-weak">{email}</div>}
                    </div>
                </div>
                {right}
            </div>
        </Element>
    );
};

const AccountSwitcherItem: PolymorphicForwardRefExoticComponent<OwnProps, typeof defaultElement> =
    forwardRef(AccountSwitcherItemBase);

export default AccountSwitcherItem;
