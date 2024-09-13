import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

import type { AppLinkProps } from '../link/AppLink';
import AppLink from '../link/AppLink';

const SidebarBackButton = ({ children, ...rest }: AppLinkProps, ref: Ref<HTMLAnchorElement>) => {
    return (
        <ButtonLike
            ref={ref}
            as={AppLink}
            size="large"
            color="weak"
            shape="solid"
            fullWidth
            className="flex items-center justify-center flex-nowrap gap-2"
            {...rest}
        >
            <Icon name="arrow-left" className="rtl:mirror shrink-0" />
            <span className="text-ellipsis">{children ? children : c('Navigation').t`Back`}</span>
        </ButtonLike>
    );
};

export default forwardRef<HTMLAnchorElement, AppLinkProps>(SidebarBackButton);
