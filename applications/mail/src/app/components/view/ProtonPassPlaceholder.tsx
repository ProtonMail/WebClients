import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID } from '@proton/components/components/drawer/views/SecurityCenter/constants';
import { useDrawer } from '@proton/components/hooks';
import connectSimpleLoginSvg from '@proton/styles/assets/img/illustrations/connect-simple-login.svg';

const ProtonPassPlaceholder = () => {
    const { toggleDrawerApp, appInView } = useDrawer();

    const openSecurityCenterInDrawer = () => {
        if (appInView === 'security-center') {
            document.getElementById(DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID)?.click();
        } else {
            toggleDrawerApp({ app: 'security-center' })();
        }
    };

    return (
        <>
            <div className="mb-8">
                <img
                    src={connectSimpleLoginSvg}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                    className="h-auto"
                />
            </div>
            <h2 className="text-bold">{c('Title').t`Don't give spam a chance`}</h2>
            <p className="mx-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
                {c('Info')
                    .t`They can't spam you if they don't know your email address. Protect your inbox with hide-my-email aliases.`}
            </p>
            <Button onClick={openSecurityCenterInDrawer} color="norm" shape="outline">
                {appInView === 'security-center' ? c('Action').t`Create alias` : c('Action').t`Hide my email`}
            </Button>
        </>
    );
};

export default ProtonPassPlaceholder;
