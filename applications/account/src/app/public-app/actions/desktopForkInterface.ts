import type { QRCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import type { APP_NAMES } from '@proton/shared/lib/constants';

export interface ProduceDesktopForkParameters {
    app: APP_NAMES;
    redirectUrl: string | undefined;
    qrCodePayload: QRCodePayload;
}
