import { c } from 'ttag';

import QRCode from '@proton/components/components/image/QRCode';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import protonQRLogo from './proton-qr-logo.svg';

const SignInWithAnotherDeviceQRCode = ({ data }: { data: string }) => {
    const { createNotification } = useNotifications();
    return (
        <div
            onMouseDown={(e) =>
                /* preventDefault to avoid double click causing a selection highlight*/
                e.preventDefault()
            }
            onDoubleClick={(e) => {
                textToClipboard(data, e.currentTarget);
                createNotification({ text: c('edm').t`Code copied to clipboard` });
            }}
        >
            <QRCode
                data-testid="qrcode"
                className="bg-norm flex w-custom fade-in"
                style={{ '--w-custom': '9rem' }}
                value={data}
                fgColor="#15006F"
                imageSettings={{
                    src: protonQRLogo,
                    height: 44,
                    width: 44,
                    excavate: false,
                }}
            />
        </div>
    );
};

export default SignInWithAnotherDeviceQRCode;
