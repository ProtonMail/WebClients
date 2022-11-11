import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import {
    Href,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useSettingsLink,
    useUser,
} from '@proton/components';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import userPromptSvg from '@proton/styles/assets/img/illustrations/sign-in-at-proton-me.svg';

interface Props extends ModalProps {
    app?: APP_NAMES;
}

const FinalMigrationModal = ({ app = APPS.PROTONACCOUNT, ...rest }: Props) => {
    const settingsLink = useSettingsLink();
    const [user] = useUser();

    // Should not be translated
    const PROTON_ME_DOMAIN = 'proton.me';

    const link = (
        <Href key="link" href="https://account.proton.me">
            proton.me
        </Href>
    );

    const boldPasswordReset = <b key="passwordReset">{c('Info').t`password reset`}</b>;

    const secondaryButton = (() => {
        if (user.MnemonicStatus === MNEMONIC_STATUS.ENABLED || user.MnemonicStatus === MNEMONIC_STATUS.PROMPT) {
            /**
             * We can automatically generate a recovery phrase without password prompt
             */
            return (
                <Button
                    onClick={() => {
                        rest.onClose?.();
                        settingsLink('/recovery?action=generate-recovery-phrase-account-reset', app);
                    }}
                >
                    {c('Info').t`Reset password`}
                </Button>
            );
        }

        return (
            <ButtonLike shape="outline" as={Href} href="https://account.proton.me/reset-password">
                {c('Info').t`Reset password`}
            </ButtonLike>
        );
    })();

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader
                title={
                    // translator: full sentence "We have moved to proton.me"
                    c('Title').t`We have moved to ${PROTON_ME_DOMAIN}`
                }
            />
            <ModalTwoContent>
                <img src={userPromptSvg} alt="" />

                <p className="mb1">
                    {
                        // translator: full sentence "There have been no changes to your email address or your Proton Account. Just sign in over at proton.me."
                        c('Info')
                            .jt`There have been no changes to your email address or your ${BRAND_NAME} Account. Just sign in over at ${link}.`
                    }
                </p>
                <p className="my1">
                    {
                        // translator: full sentence "If you don’t know your password, you’ll need to do a password reset to access the new site."
                        c('Info')
                            .jt`If you don’t know your password, you’ll need to do a ${boldPasswordReset} to access the new site.`
                    }
                </p>
            </ModalTwoContent>

            <ModalTwoFooter>
                {secondaryButton}

                <ButtonLike color="norm" as={Href} href="https://account.proton.me">
                    {c('Info').t`Sign in`}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default FinalMigrationModal;
