import { c } from 'ttag';

import { ButtonLike } from '../button';
import { Icon } from '../icon';
import AppLink, { AppLinkProps } from '../link/AppLink';

const SidebarBackButton = ({ children, ...rest }: AppLinkProps) => {
    return (
        <ButtonLike
            as={AppLink}
            size="large"
            color="weak"
            shape="solid"
            fullWidth
            className="mt0-25 flex flex-align-items-center flex-justify-center flex-nowrap flex-gap-0-5"
            {...rest}
        >
            <Icon name="arrow-left" className="on-rtl-mirror flex-item-noshrink" />
            <span className="text-ellipsis">{children ? children : c('Navigation').t`Back`}</span>
        </ButtonLike>
    );
};

export default SidebarBackButton;
