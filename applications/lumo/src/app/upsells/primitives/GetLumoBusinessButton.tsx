import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LUMO_BUSINESS_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { getMarketingUrl } from '../../util/marketingUrls';

import './GetLumoBusinessButton.scss';

interface GetLumoBusinessButtonProps {
    onClick?: () => void;
    loading?: boolean;
}

const GetLumoBusinessButton = ({ onClick, loading }: GetLumoBusinessButtonProps) => {
    const className = clsx('shrink-0', LUMO_UPGRADE_TRIGGER_CLASS, 'lumo-business-button');
    const buttonText = c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} AI Pro`;

    if (onClick) {
        return (
            <ButtonLike
                as="button"
                onClick={onClick}
                loading={loading}
                shape="solid"
                color="norm"
                size="medium"
                fullWidth
                className={className}
            >
                {buttonText}
            </ButtonLike>
        );
    }

    return (
        <ButtonLike
            as={Href}
            href={getMarketingUrl(LUMO_BUSINESS_PATH)}
            shape="solid"
            color="norm"
            size="medium"
            fullWidth
            className={className}
        >
            {buttonText}
        </ButtonLike>
    );
};

export default GetLumoBusinessButton;
