import { forwardRef } from 'react';

import { c } from 'ttag';

import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

import type { TopNavbarListItemButtonProps } from './TopNavbarListItemButton';
import TopNavbarListItemButton from './TopNavbarListItemButton';

const TopNavbarListItemSearchButtonBase = (
    props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>,
    ref: typeof props.ref
) => {
    return (
        <TopNavbarListItemButton
            {...props}
            ref={ref}
            as="button"
            type="button"
            icon={<IcMagnifier />}
            title={c('Header').t`Search`}
            text={c('Header').t`Search`}
        />
    );
};

const TopNavbarListItemSearchButton = forwardRef(TopNavbarListItemSearchButtonBase);

export default TopNavbarListItemSearchButton;
