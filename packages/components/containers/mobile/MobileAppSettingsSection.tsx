import { c } from 'ttag';

import { Href } from '@proton/atoms';
import QRCode from '@proton/components/components/image/QRCode';
import Logo from '@proton/components/components/logo/Logo';
import {
    CALENDAR_APP_NAME,
    CALENDAR_MOBILE_APP_LINKS,
    MAIL_APP_NAME,
    MAIL_MOBILE_APP_LINKS,
} from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

type SupportedAPPS = 'proton-mail' | 'proton-calendar';

interface ProductCardProps {
    qrCodeLink: string;
    app: SupportedAPPS;
    appStoreLink: string;
    playStoreLink: string;
}

const ProductDownloadCard = ({ app, qrCodeLink, appStoreLink, playStoreLink }: ProductCardProps) => {
    const appName = app === 'proton-mail' ? MAIL_APP_NAME : CALENDAR_APP_NAME;

    return (
        <section className="flex flex-column gap-6 items-center border rounded-lg p-6 text-center align-center">
            <div
                className="border rounded p-1.5 h-custom w-custom"
                style={{ '--h-custom': '7.5rem', '--w-custom': '7.5rem' }}
            >
                <QRCode value={qrCodeLink} />
            </div>
            <div>
                <Logo appName={app} variant="glyph-only" size={12} />
                <h3 className="text-bold text-4xl">{appName}</h3>
            </div>
            <div className="flex gap-2">
                <Href href={appStoreLink} target="_blank">
                    <img
                        className="h-custom"
                        style={{ '--h-custom': '2.25rem' }}
                        src={appStoreSvg}
                        // translator: Shows the app name such as: Proton Mail on App Store. Only supports Proton Mail and Proton Calendar
                        alt={c('Get started checklist instructions').t`${appName} on App Store`}
                    />
                </Href>
                <Href href={playStoreLink} target="_blank">
                    <img
                        className="h-custom"
                        style={{ '--h-custom': '2.25rem' }}
                        src={playStoreSvg}
                        // translator: Shows the app name such as: Proton Mail on Play Store. Only supports Proton Mail and Proton Calendar
                        alt={c('Get started checklist instructions').t`${appName} on Play Store`}
                    />
                </Href>
            </div>
        </section>
    );
};

const MobileAppSecttingsSection = () => {
    return (
        <div className="flex gap-6 mt-3">
            <ProductDownloadCard
                app="proton-mail"
                qrCodeLink={MAIL_MOBILE_APP_LINKS.qrCode}
                appStoreLink={MAIL_MOBILE_APP_LINKS.appStore}
                playStoreLink={MAIL_MOBILE_APP_LINKS.playStore}
            />
            <ProductDownloadCard
                app="proton-calendar"
                qrCodeLink={CALENDAR_MOBILE_APP_LINKS.qrCode}
                appStoreLink={CALENDAR_MOBILE_APP_LINKS.appStore}
                playStoreLink={CALENDAR_MOBILE_APP_LINKS.playStore}
            />
        </div>
    );
};

export default MobileAppSecttingsSection;
