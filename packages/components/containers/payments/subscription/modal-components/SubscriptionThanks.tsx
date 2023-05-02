import { c } from 'ttag';

import { CircleLoader, Href } from '@proton/atoms';
import { APPS, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { PaymentMethodType } from '@proton/shared/lib/interfaces';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import mailThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-mail.svg';
import vpnThanksSvg from '@proton/styles/assets/img/illustrations/thank-you-vpn.svg';

import { PrimaryButton } from '../../../../components';
import { useConfig } from '../../../../hooks';

interface Props {
    onClose?: () => void;
    method?: PaymentMethodType;
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
                <h1 className="text-center mb-0">
                    <img src={isVPN ? vpnThanksSvg : mailThanksSvg} alt="Thanks" />
                </h1>
                {method && [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method as any) ? (
                    <p className="text-center mb-4">{c('Info')
                        .t`Your account will be updated once the payment is cleared.`}</p>
                ) : (
                    <p className="text-center mb-4 text-bold text-xl" data-testid="successfull-update">{c('Info')
                        .t`Account successfully updated`}</p>
                )}
                <p className="text-center mb-8" data-testid="more-info">{c('Info')
                    .t`Download your favorite app today and take privacy with you everywhere you go.`}</p>
                <div className="mt-4 mb-8 text-center">
                    <Href
                        href={
                            isVPN
                                ? 'https://play.google.com/store/apps/details?id=ch.protonvpn.android'
                                : 'https://play.google.com/store/apps/details?id=ch.protonmail.android'
                        }
                        className="mr-8"
                    >
                        <img width="150" src={playStoreSvg} alt="Play Store" />
                    </Href>
                    <Href
                        href={
                            isVPN
                                ? 'https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085'
                                : 'https://apps.apple.com/app/protonmail-encrypted-email/id979659905'
                        }
                    >
                        <img width="150" src={appStoreSvg} alt="App Store" />
                    </Href>
                </div>
                <div className="text-center pb2">
                    <PrimaryButton fullWidth onClick={onClose} data-testid="modal:close">{c('Action')
                        .t`Close`}</PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionThanks;
