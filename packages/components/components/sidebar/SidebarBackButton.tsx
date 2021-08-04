import AppLink, { Props as LinkProps } from '../link/AppLink';
import { ButtonLike } from '../button';
import { Icon } from '../icon';

const SidebarBackButton = ({ children, ...rest }: LinkProps) => {
    return (
        <ButtonLike
            as={AppLink}
            size="large"
            color="weak"
            shape="solid"
            fullWidth
            className="mt0-25 flex flex-align-items-center flex-justify-center"
            {...rest}
        >
            <Icon name="arrow-left" />
            <span className="ml0-5">{children}</span>
        </ButtonLike>
    );
};

export default SidebarBackButton;
