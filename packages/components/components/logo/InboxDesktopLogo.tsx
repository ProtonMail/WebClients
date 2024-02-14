import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import InboxDesktopBeta from '@proton/styles/assets/img/icons/inbox-desktop-app-beta.svg';
import InboxDesktop from '@proton/styles/assets/img/icons/inbox-desktop-app.svg';

interface Props {
    environment?: 'default' | 'beta';
}

const InboxDesktopLogo = ({ environment: variant = 'default' }: Props) => {
    return (
        <img
            src={variant === 'default' ? InboxDesktop : InboxDesktopBeta}
            alt={c('App logo').t`Download ${MAIL_APP_NAME} desktop application`}
        />
    );
};

export default InboxDesktopLogo;
