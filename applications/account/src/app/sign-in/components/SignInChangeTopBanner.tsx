import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import useLocalState from '@proton/components/hooks/useLocalState';
import { IcBell } from '@proton/icons/icons/IcBell';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import signInChangeGif from './sign-in-change.gif';

/** Announces the upcoming two-step sign-in (username, then password), above the credentials screens. */
export const SignInChangeTopBanner = () => {
    const [isDismissed, setIsDismissed] = useLocalState(false, 'sign-in-change-banner-dismissed');
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const isEnabled = useFlag('SigninPageIsChangingBanner');
    const theme = useTheme();

    if (!isEnabled || isDismissed) {
        return null;
    }

    const learnMore = (
        <InlineLinkButton key="learn-more" className="color-inherit" onClick={() => setModalOpen(true)}>
            {c('Action').t`Learn more`}
        </InlineLinkButton>
    );

    return (
        <>
            <TopBanner
                className={clsx('bg-norm text-normal', theme.information.dark ? 'color-norm' : 'color-primary')}
                onClose={() => setIsDismissed(true)}
                data-testid="sign-in-change-banner"
            >
                <IcBell className="shrink-0 mr-1" />
                {
                    // translator: full sentence "We're changing the Proton sign-in page. Your password and devices stay the same. Learn more"
                    c('Info')
                        .jt`We're changing the ${BRAND_NAME} sign-in page. Your password and devices stay the same. ${learnMore}`
                }
            </TopBanner>
            {renderModal && (
                <ModalTwo size="small" {...modalProps}>
                    <ModalTwoHeader
                        title={c('Title').t`Signing in is changing`}
                        className="flex justify-center"
                        titleClassName="text-center"
                        hasClose={false}
                    />
                    <ModalTwoContent className="text-center">
                        <img src={signInChangeGif} alt="" className="w-full rounded-lg mb-6" width={656} height={328} />
                        <p className="mt-0 mb-4 px-0.5">
                            {c('Info')
                                .t`Soon, you'll enter your email address (or username) and password in 2 separate steps instead of on 1 page.`}
                        </p>
                        <p className="m-0 text-semibold">{c('Info').t`Your password and devices stay the same.`}</p>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button color="norm" fullWidth onClick={modalProps.onClose}>
                            {c('Action').t`Got it`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
