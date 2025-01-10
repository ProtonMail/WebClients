import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import porkbunLogo from './porkbun.svg';

import './PorkbunHeader.scss';

const PorkbunHeader = () => {
    return (
        <div
            className={clsx(
                'porkbun-header flex flex-nowrap w-full items-center text-center md:text-left px-2 py-2 rounded-full gap-1'
            )}
        >
            <img src={porkbunLogo} alt="" />
            <span className={clsx('px-2 block md:inline')}>
                {c('mail_signup_2024: Info').t`Set up your account with your Porkbun domain.`}
            </span>
        </div>
    );
};

export default PorkbunHeader;
