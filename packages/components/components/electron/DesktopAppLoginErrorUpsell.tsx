import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import mailHeaderImage from '@proton/styles/assets/img/illustrations/upsell-mail-header.svg';

import { ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '../modalTwo';

const DesktopAppLoginErrorUpsell = (modalProps: ModalStateProps) => {
    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader />
            <ModalTwoContent className="mb-8">
                <div>
                    <div className="text-center">
                        <div className="mb-4 rounded">
                            <img src={mailHeaderImage} className="w-full block" alt="ProtonMail logo and a plus sign" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="mt-4 mb-6">
                        <h1 className="mb-2 h3 w-full text-bold text-center">
                            {c('Desktop app upsell').t`Access to the desktop app is limited`}
                        </h1>
                        <p className="mt-0 mb-4">{c('Desktop app upsell')
                            .t`The beta version of the ${MAIL_APP_NAME} desktop app is currently limited to ${BRAND_NAME} Visionary subscribers. It will be available to all users in early 2024.`}</p>
                        <p className="my-0">{c('Desktop app upsell')
                            .t`Upgrade today or check again in early 2024 for access.`}</p>
                    </div>
                    <ButtonLike
                        as="a"
                        fullWidth
                        color="norm"
                        size="large"
                        href="https://proton.me/visionary"
                        target="_blank"
                    >
                        {c('Action').t`Upgrade to Visionary`}
                    </ButtonLike>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default DesktopAppLoginErrorUpsell;
