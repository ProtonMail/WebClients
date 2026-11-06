import { c } from 'ttag';

import porkbunLogo from './porkbun.svg';

import './PorkbunHeader.scss';

const PorkbunHeader = () => {
    return (
        <div>
            <div className="porkbun-header flex flex-col md:flex-row justify-center w-full items-center text-center md:text-left px-2 py-2 rounded-full gap-1">
                <img src={porkbunLogo} alt="" />
                <span className="px-2 block md:inline">
                    {c('mail_signup_2024: Info').t`Set up your account with your Porkbun domain.`}
                </span>
            </div>
        </div>
    );
};

export default PorkbunHeader;
