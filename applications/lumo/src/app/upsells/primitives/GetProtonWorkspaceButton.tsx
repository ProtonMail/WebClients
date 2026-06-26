import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LUMO_TO_WORKSPACE_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { getMarketingUrl } from '../../util/marketingUrls';

const GetProtonWorkspaceButton = () => {
    return (
        <ButtonLike
            as={Href}
            href={getMarketingUrl(LUMO_TO_WORKSPACE_PATH)}
            shape="solid"
            color="norm"
            size="medium"
            fullWidth
            className={clsx('shrink-0', LUMO_UPGRADE_TRIGGER_CLASS)}
        >
            {c('collider_2025: Upsell Title').t`Get ${BRAND_NAME} Workspace`}
        </ButtonLike>
    );
};

export default GetProtonWorkspaceButton;
