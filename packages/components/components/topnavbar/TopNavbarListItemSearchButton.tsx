import { forwardRef } from 'react';
import { c } from 'ttag';

import TopNavbarListItemButton, { TopNavbarListItemButtonProps } from './TopNavbarListItemButton';
import { Icon } from '../icon';

const TopNavbarListItemSearchButton = forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                as="button"
                type="button"
                icon={<Icon name="magnifying-glass" />}
                title={c('Header').t`Search`}
                text={c('Header').t`Search`}
            />
        );
    }
);

export default TopNavbarListItemSearchButton;
