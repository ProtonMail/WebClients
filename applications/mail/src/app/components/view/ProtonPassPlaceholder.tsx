import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID, useDrawer, useTheme } from '@proton/components';
import { getPlaceholderSrc } from '@proton/mail/helpers/getPlaceholderSrc';
import noSpamSvgDark from '@proton/styles/assets/img/placeholders/auto-delete-cool-dark.svg';
import noSpamSvgLight from '@proton/styles/assets/img/placeholders/auto-delete-cool-light.svg';
import noSpamSvgWarm from '@proton/styles/assets/img/placeholders/auto-delete-warm-light.svg';

const ProtonPassPlaceholder = () => {
    const theme = useTheme();
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
                    height={128}
                    src={getPlaceholderSrc({
                        theme: theme.information.theme,
                        warmLight: noSpamSvgWarm,
                        coolLight: noSpamSvgLight,
                        coolDark: noSpamSvgDark,
                    })}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                    className="w-auto"
                />
            </div>
            <h2 className="text-bold">{c('Title').t`Don't give spam a chance`}</h2>
            <p className="mx-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
                {c('Info')
                    .t`They can't spam you if they don't know your email address. Protect your inbox with hide-my-email aliases.`}
            </p>
            <Button onClick={openSecurityCenterInDrawer} color="norm" shape="outline">
                {appInView === 'security-center' ? c('Action').t`Create alias` : c('Action').t`Hide-my-email`}
            </Button>
        </>
    );
};

export default ProtonPassPlaceholder;
