import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { QRCode } from '@proton/components/components';
import Logo from '@proton/components/components/logo/Logo';
import { CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
                qrCodeLink="https://proton.me/mailapp"
                appStoreLink="https://apps.apple.com/app/apple-store/id979659905"
                playStoreLink="https://play.google.com/store/apps/details?id=ch.protonmail.android"
            />
            <ProductDownloadCard
                app="proton-calendar"
                qrCodeLink="https://proton.me/calapp"
                appStoreLink="https://apps.apple.com/app/apple-store/id1514709943"
                playStoreLink="https://play.google.com/store/apps/details?id=me.proton.android.calendar"
            />
        </div>
    );
};

export default MobileAppSecttingsSection;
