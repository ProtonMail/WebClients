import { forwardRef } from 'react';

import { c } from 'ttag';

import { Icon } from '../icon';
import TopNavbarListItemButton, { TopNavbarListItemButtonProps } from './TopNavbarListItemButton';

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
            icon={<Icon name="magnifier" />}
            title={c('Header').t`Search`}
            text={c('Header').t`Search`}
        />
    );
};

const TopNavbarListItemSearchButton = forwardRef(TopNavbarListItemSearchButtonBase);

export default TopNavbarListItemSearchButton;
