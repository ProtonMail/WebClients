import React from 'react';
import { c } from 'ttag';
import { ButtonLike, Href, Icon } from 'react-components';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import { DOWNLOAD_SHARED_STATE } from '../../../constants';

interface Props {
    contentState: DOWNLOAD_SHARED_STATE;
    onClose: () => void;
}

const BF_DEAL_URL = 'https://protonmail.com/blackfriday';
const UTM_PARAMS = {
    [DOWNLOAD_SHARED_STATE.ENTER_PASS]:
        'utm_campaign=ww-en-2a-drive-pmm_drive-shared_link_page_signup&utm_source=proton_users&utm_medium=cta&utm_content=enter_pw_page&utm_term=get_your_own_protondrive',
    [DOWNLOAD_SHARED_STATE.DOWNLOAD]:
        'utm_campaign=ww-en-2a-drive-pmm_drive-shared_link_page_signup&utm_source=proton_users&utm_medium=cta&utm_content=ready_to_dl_page&utm_term=get_your_own_protondrive',
    [DOWNLOAD_SHARED_STATE.DOES_NOT_EXIST]:
        'utm_campaign=ww-en-2a-drive-pmm_drive-shared_link_page_signup&utm_source=proton_users&utm_medium=cta&utm_content=expired_page&utm_term=get_your_own_protondrive',
};

const DiscountBanner = ({ contentState, onClose }: Props) => {
    const url = `${BF_DEAL_URL}?${UTM_PARAMS[contentState]}`;
    const appName = getAppName(APPS.PROTONDRIVE);

    return (
        <div className="discount-banner bg-primary p0-25 mb1 mr1 w100 on-mobile-m0 on-mobile-max-w100">
            {onClose ? (
                <button type="button" className="float-right mr0-25" onClick={onClose}>
                    <Icon name="off" size={12} />
                </button>
            ) : null}
            <div className="flex flex-column flex-nowrap flex-align-items-center text-center p1 w100">
                <h3 className="text-uppercase text-bold m0">{c('Title').t`Get your own ${appName}`}</h3>
                <p className="mt1 mb1 text-sm">{c('Label').t`Up to 47% off on new subscriptions`}</p>
                <ButtonLike as={Href} url={url} color="norm" size="large" className="mt0-25 mb1">
                    {c('Action').t`Get the deal`}
                </ButtonLike>
            </div>
        </div>
    );
};

export default DiscountBanner;
