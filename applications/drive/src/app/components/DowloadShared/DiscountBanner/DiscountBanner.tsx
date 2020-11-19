import React from 'react';
import { c } from 'ttag';
import { Href, Icon } from 'react-components';

interface Props {
    onClose: () => void;
}

const BF_DEAL_URL = 'https://protonmail.com/blog/black-friday-2020/';

const DiscountBanner = ({ onClose }: Props) => {
    return (
        <div className="pd-discount-banner bg-primary color-white-dm p0-25 mb1 mr1 w100 onmobile-m0 onmobile-mw100">
            {onClose ? (
                <button type="button" className="right mr0-25" onClick={onClose}>
                    <Icon name="off" size={12} />
                </button>
            ) : null}
            <div className="flex flex-column flex-nowrap flex-items-center aligncenter p1 w100">
                <h3 className="uppercase bold">{c('Title').t`Get your own protondrive`}</h3>
                <p className="m0 small bold">
                    {c('Label').t`Up to 50% off on new subscriptions via our Black Friday promotion`}
                </p>
                <Href url={BF_DEAL_URL} className="pm-button--primary pm-button--large mt1 mb1">
                    {c('Action').t`Get the deal`}
                </Href>
            </div>
        </div>
    );
};

export default DiscountBanner;
