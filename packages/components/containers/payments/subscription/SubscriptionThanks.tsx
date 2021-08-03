import { c } from 'ttag';
import { APPS, PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import mailThanksSvg from '@proton/styles/assets/img/pm-images/thank-you-mail.svg';
import vpnThanksSvg from '@proton/styles/assets/img/pv-images/thank-you-vpn.svg';
import appStoreSvg from '@proton/styles/assets/img/shared/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/shared/play-store.svg';
import { PrimaryButton, Href } from '../../../components';
import { useConfig } from '../../../hooks';

interface Props {
    onClose?: () => void;
    method?: PAYMENT_METHOD_TYPE;
}
const SubscriptionThanks = ({ method, onClose }: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <>
            <h1 className="text-center mb0">
                <img src={isVPN ? vpnThanksSvg : mailThanksSvg} alt="Thanks" />
            </h1>
            {method && [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method as any) ? (
                <p className="text-center mb1">{c('Info')
                    .t`Your account will be updated once the payment is cleared.`}</p>
            ) : (
                <p className="text-center mb1 text-bold text-xl">{c('Info').t`Account successfully updated`}</p>
            )}
            <p className="text-center mb2">{c('Info')
                .t`Download your favorite app today and take privacy with you everywhere you go.`}</p>
            <div className="mt1 mb2 text-center">
                <Href
                    url={
                        isVPN
                            ? 'https://play.google.com/store/apps/details?id=ch.protonvpn.android'
                            : 'https://play.google.com/store/apps/details?id=ch.protonmail.android'
                    }
                    className="mr2"
                >
                    <img width="150" src={playStoreSvg} alt="Play Store" />
                </Href>
                <Href
                    url={
                        isVPN
                            ? 'https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085'
                            : 'https://apps.apple.com/app/protonmail-encrypted-email/id979659905'
                    }
                >
                    <img width="150" src={appStoreSvg} alt="App Store" />
                </Href>
            </div>
            <div className="text-center mb2">
                <PrimaryButton fullWidth onClick={onClose}>{c('Action').t`Close`}</PrimaryButton>
            </div>
        </>
    );
};

export default SubscriptionThanks;
