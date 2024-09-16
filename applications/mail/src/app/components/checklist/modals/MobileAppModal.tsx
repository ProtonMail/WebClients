import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, QRCode } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

import './MobileAppModal.scss';

const MobileAppModal = ({ ...rest }: ModalStateProps) => (
    <ModalTwo {...rest} size="small">
        <ModalTwoHeader />
        <ModalTwoContent className="modal-content text-center flex gap-4 mb-6">
            <h1 className="text-bold text-2xl">{c('Get started checklist instructions')
                .t`Get the ${MAIL_APP_NAME} mobile app`}</h1>
            <div className="mobile-modal-gradient flex flex-column gap-4 p-8 rounded-lg items-center">
                <QRCode
                    className="bg-norm flex p-2 rounded-sm mx-auto w-custom"
                    style={{ '--w-custom': '10em' }}
                    value="https://proton.me/mailapp"
                />
                <span style={{ color: 'var(--optional-promotion-text-color)' }}>
                    {c('Get started checklist instructions')
                        .t`Using your mobile device, scan this QR code or visit the iOS or Android store.`}
                </span>
                <div className="flex gap-3 flex-nowrap bg-norm p-2 rounded">
                    <Href href="https://apps.apple.com/app/protonmail-encrypted-email/id979659905">
                        <img
                            className="h-custom"
                            style={{ '--h-custom': '2.5rem' }}
                            src={appStoreSvg}
                            alt={c('Get started checklist instructions').t`${MAIL_APP_NAME} on App Store`}
                        />
                    </Href>
                    <Href href="https://play.google.com/store/apps/details?id=ch.protonmail.android">
                        <img
                            className="h-custom"
                            style={{ '--h-custom': '2.5rem' }}
                            src={playStoreSvg}
                            alt={c('Get started checklist instructions').t`${MAIL_APP_NAME} on Play Store`}
                        />
                    </Href>
                </div>
                <span className="text-sm" style={{ color: 'var(--optional-promotion-text-color)' }}>{c(
                    'Get started checklist instructions'
                ).t`Sign in to the mobile app to complete this step`}</span>
            </div>
        </ModalTwoContent>
    </ModalTwo>
);

export default MobileAppModal;
