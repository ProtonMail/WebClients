import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { APPS, PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import mailThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-mail.svg';
import vpnThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-vpn.svg';

import { Href, PrimaryButton } from '../../../../components';
import { useConfig } from '../../../../hooks';

interface Props {
    onClose?: () => void;
    method?: PAYMENT_METHOD_TYPE;
    loading?: boolean;
}

const SubscriptionThanks = ({ method, onClose, loading }: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <div className="relative">
            {loading && (
                <div className="text-center absolute absolute-center pb4">
                    <CircleLoader size="large" className="color-primary" />
                </div>
            )}
            <div className={loading ? 'visibility-hidden' : undefined}>
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
                <div className="text-center pb2">
                    <PrimaryButton fullWidth onClick={onClose}>{c('Action').t`Close`}</PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionThanks;
