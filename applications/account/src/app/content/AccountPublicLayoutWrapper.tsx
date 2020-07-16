import * as React from 'react';

import { c } from 'ttag';
import { ProtonLogo, AccountSupportDropdown } from 'react-components';
import AccountPublicLayout, { Props as AccountProps } from 'react-components/containers/signup/AccountPublicLayout';

import locales from '../locales';

const AccountPublicLayoutWrapper = ({ children, ...rest }: AccountProps) => {
    return (
        <AccountPublicLayout
            locales={locales}
            center={<ProtonLogo />}
            right={
                <AccountSupportDropdown noCaret={true} className="link">{c('Action')
                    .t`Need help?`}</AccountSupportDropdown>
            }
            {...rest}
        >
            {children}
        </AccountPublicLayout>
    );
};

export default AccountPublicLayoutWrapper;
