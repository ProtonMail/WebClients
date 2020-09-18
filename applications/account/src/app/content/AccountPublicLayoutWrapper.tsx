import * as React from 'react';
import { c } from 'ttag';
import locales from 'proton-shared/lib/i18n/locales';
import { ProtonLogo, AccountSupportDropdown } from 'react-components';
import AccountPublicLayout, { Props as AccountProps } from 'react-components/containers/signup/AccountPublicLayout';

const AccountPublicLayoutWrapper = ({ children, ...rest }: AccountProps) => {
    return (
        <AccountPublicLayout
            locales={locales}
            center={<ProtonLogo />}
            right={
                <AccountSupportDropdown noCaret className="link nodecoration">
                    {c('Action').t`Need help?`}
                </AccountSupportDropdown>
            }
            {...rest}
        >
            {children}
        </AccountPublicLayout>
    );
};

export default AccountPublicLayoutWrapper;
