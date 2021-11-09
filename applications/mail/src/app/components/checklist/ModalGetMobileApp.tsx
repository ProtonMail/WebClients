import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { DialogModal, ModalCloseButton, InnerModal, ModalPropsInjection, QRCode, Href } from '@proton/components';

const protonMailAppName = getAppName(APPS.PROTONMAIL);

const ModalGetMobileApp = ({ onClose, ...rest }: Partial<ModalPropsInjection>) => (
    <DialogModal intermediate onClose={onClose} {...rest}>
        <ModalCloseButton onClose={onClose} />
        <InnerModal className="modal-content pb2 pt2 text-center">
            <h1 className="mb0-5 text-2xl text-bold">{c('Get started checklist instructions')
                .t`Get the ${protonMailAppName} mobile app`}</h1>
            <div className="mb2 ">{c('Get started checklist instructions').t`Available on iOS and Android.`}</div>
            <div className=" mb2">
                <QRCode value="https://pm.me/app?type=qr" size={200} />
            </div>
            <div className="mb1">{c('Get started checklist instructions')
                .t`Using your mobile device, scan this QR code or visit`}</div>
            <div className="text-2xl text-bold">
                <Href href="https://pm.me/app">pm.me/app</Href>
            </div>
            <p>{c('Get started checklist instructions').t`Sign into the mobile app to complete the action`}</p>
        </InnerModal>
    </DialogModal>
);

export default ModalGetMobileApp;
