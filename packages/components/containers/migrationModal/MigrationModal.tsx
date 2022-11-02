import { useEffect } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import {
    FeatureCode,
    Href,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFeature,
    useSettingsLink,
} from '@proton/components';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import userPromptSvg from '@proton/styles/assets/img/illustrations/sign-in-at-proton-me.svg';

interface Props extends ModalProps {
    app?: APP_NAMES;
}

const MigrationModal = ({ app = APPS.PROTONACCOUNT, ...rest }: Props) => {
    const { update } = useFeature(FeatureCode.MigrationModalLastShown);
    const settingsLink = useSettingsLink();

    useEffect(() => {
        if (!open) {
            return;
        }
        const now = new Date().toISOString();
        void update(now);
    }, [open]);

    // Should not be translated
    const PROTON_ME_DOMAIN = 'proton.me';

    const link = (
        <Href key="link" href="https://account.proton.me">
            account.proton.me
        </Href>
    );

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader
                title={
                    // translator: full sentence "Sign in at proton.me"
                    c('Title').t`Sign in at ${PROTON_ME_DOMAIN}`
                }
            />
            <ModalTwoContent>
                <img src={userPromptSvg} alt="" />
                <p className="mb1">
                    {
                        // translator: full sentence "We’re moving to proton.me."
                        c('Info').t`We’re moving to ${PROTON_ME_DOMAIN}.`
                    }
                </p>
                <p className="my1">
                    {
                        // translator: full sentence "Your email address will not change. But soon, you’ll need to sign in at account.proton.me. "
                        c('Info').jt`Your email address will not change. But soon, you’ll need to sign in at ${link}.`
                    }
                </p>
                <p className="my1">
                    {c('Info')
                        .t`If you don’t know your password, set a recovery phrase to make sure you don’t lose access to your account and data.`}
                </p>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button
                    onClick={() => {
                        rest.onClose?.();
                        settingsLink('/recovery?action=generate-recovery-phrase', app);
                    }}
                    shape="outline"
                >
                    {c('Info').t`Set recovery phrase`}
                </Button>
                <ButtonLike color="norm" as={Href} href="https://account.proton.me">
                    {c('Info').t`Sign in`}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MigrationModal;
