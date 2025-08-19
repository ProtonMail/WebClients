import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';

import { PromotionBanner } from '../../banner/PromotionBanner';
import AuthenticatorPromotionModal from './AuthenticatorPromotionModal';
import authenticatorLogo from './assets/authenticator-logo.svg';

const AuthenticatorPromotionBanner = ({ className }: { className?: string }) => {
    const [authenticatorModal, setAuthenticatorModal, renderAuthenticatorModal] = useModalState();

    return (
        <>
            {renderAuthenticatorModal && <AuthenticatorPromotionModal {...authenticatorModal} />}
            <PromotionBanner
                rounded="xl"
                mode="banner"
                contentCentered={false}
                className={className}
                icon={
                    <div
                        className="rounded mr-2 shadow-norm shadow-color-primary flex items-center justify-center w-custom h-custom"
                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem', background: 'white' }}
                    >
                        <img src={authenticatorLogo} alt="" width={26} height={26} />
                    </div>
                }
                description={
                    <>
                        <strong>{c('Info').t`Get ${AUTHENTICATOR_APP_NAME} for all your devices.`}</strong>
                        <br />
                        {c('Info').t`Download the app and import existing codes.`}
                    </>
                }
                cta={
                    <Button color="norm" fullWidth onClick={() => setAuthenticatorModal(true)}>
                        {c('Action').t`Learn more`}
                    </Button>
                }
            />
        </>
    );
};

export default AuthenticatorPromotionBanner;
