import { c } from 'ttag';

import { Banner, type BannerProps } from '@proton/atoms/Banner/Banner';

interface Props extends Omit<BannerProps, 'children'> {
    hasPermission: boolean;
}

const PermissionBanner = ({ hasPermission, variant = 'norm', noIcon = true, ...rest }: Props) => {
    if (hasPermission) {
        return null;
    }

    return (
        <Banner variant={variant} noIcon={noIcon} {...rest}>
            {c('Info').t`Editing requires permission`}
        </Banner>
    );
};

export default PermissionBanner;
