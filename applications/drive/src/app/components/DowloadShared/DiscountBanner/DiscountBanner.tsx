import React from 'react';
import { c } from 'ttag';
import { Href, Icon } from 'react-components';
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

    return (
        <div className="pd-discount-banner bg-primary color-white-dm p0-25 mb1 mr1 w100 onmobile-m0 onmobile-mw100">
            {onClose ? (
                <button type="button" className="right mr0-25" onClick={onClose}>
                    <Icon name="off" size={12} />
                </button>
            ) : null}
            <div className="flex flex-column flex-nowrap flex-items-center aligncenter p1 w100">
                <h3 className="uppercase bold m0">{c('Title').t`Get your own protondrive`}</h3>
                <p className="mt1 mb1 small">{c('Label').t`Up to 47% off on new subscriptions`}</p>
                <Href url={url} className="pm-button--primary pm-button--large mt0-25 mb1">
                    {c('Action').t`Get the deal`}
                </Href>
            </div>
        </div>
    );
};

export default DiscountBanner;
