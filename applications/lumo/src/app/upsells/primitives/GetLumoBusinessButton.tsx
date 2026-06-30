import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LUMO_BUSINESS_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { getMarketingUrl } from '../../util/marketingUrls';

import './GetLumoBusinessButton.scss';

const GetLumoBusinessButton = () => {
    return (
        <ButtonLike
            as={Href}
            href={getMarketingUrl(LUMO_BUSINESS_PATH)}
            shape="solid"
            color="norm"
            size="medium"
            fullWidth
            className={clsx('shrink-0', LUMO_UPGRADE_TRIGGER_CLASS, 'lumo-business-button')}
        >
            {c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} Business`}
        </ButtonLike>
    );
};

export default GetLumoBusinessButton;
