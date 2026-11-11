import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import LayoutLogosV2 from '../../../../../layout/LayoutLogosV2';
import SignupSupportDropdown from '../../../../../signup/SignupSupportDropdown';

export const Footer = () => (
    <footer
        className="flex flex-column-reverse md:flex-row w-full max-w-custom mx-auto items-center px-4 py-6 gap-4 justify-space-between"
        style={{ '--max-w-custom': '60rem' }}
    >
        <div className="flex flex-column flex-nowrap gap-1 justify-center">
            <LayoutLogosV2 size={5} />
            <div className="flex color-weak text-sm ml-0.5">{c('Footer').t`${BRAND_NAME}. Privacy by default.`}</div>
        </div>
        <SignupSupportDropdown isDarkBg />
    </footer>
);
