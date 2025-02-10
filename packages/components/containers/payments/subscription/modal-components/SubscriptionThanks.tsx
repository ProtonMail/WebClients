import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import useConfig from '@proton/components/hooks/useConfig';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/mail/constants';
import { VPN_MOBILE_APP_LINKS } from '@proton/shared/lib/vpn/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import mailThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-mail.svg';
import vpnThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-vpn.svg';
import clsx from '@proton/utils/clsx';

import '@proton/components/components/upsell/modal/NewUpsellModal.scss';

interface Props {
    onClose?: () => void;
    loading?: boolean;
    showDownloads?: boolean;
}

const SubscriptionThanks = ({ onClose, showDownloads }: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN =
        APP_NAME === APPS.PROTONVPN_SETTINGS ||
        getAppFromPathnameSafe(window.location.pathname) === APPS.PROTONVPN_SETTINGS;

    const description = showDownloads ? (
        <>
            <p className="text-center mb-0 mt-2 color-weak" data-testid="more-info">{c('Info')
                .t`Download your favorite app today and take privacy with you everywhere you go.`}</p>
            <div className="flex flex-noshrink mt-4 mb-8 text-center justify-space-around">
                <Href href={isVPN ? VPN_MOBILE_APP_LINKS.playStore : MAIL_MOBILE_APP_LINKS.playStore}>
                    <img width="135" height="40" src={playStoreSvg} alt="Play Store" />
                </Href>
                <Href href={isVPN ? VPN_MOBILE_APP_LINKS.appStore : MAIL_MOBILE_APP_LINKS.appStore}>
                    <img width="135" height="40" src={appStoreSvg} alt="App Store" />
                </Href>
            </div>
        </>
    ) : null;

    return (
        <>
            <div className="modal-two-illustration-container relative text-center fade-in-up">
                <img src={isVPN ? vpnThanksSvg : mailThanksSvg} alt="" height="128" />
            </div>
            <div className="modal-two-content-container fade-in-up">
                <ModalContent>
                    <div>
                        <div className="mt-8 mb-6">
                            <div
                                className={clsx('flex min-h-custom', description ? 'items-center' : 'items-start')}
                                style={{ '--min-h-custom': '13rem' }}
                            >
                                <div>
                                    <h1
                                        className={clsx('text-bold text-center', description ? 'text-lg' : 'text-2xl')}
                                        data-testid="successfull-update"
                                    >
                                        {c('Info').t`Account successfully updated`}
                                    </h1>
                                    {description}
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button color="norm" fullWidth onClick={onClose}>
                                    {c('Button').t`Close`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalContent>
            </div>
        </>
    );
};

export default SubscriptionThanks;
