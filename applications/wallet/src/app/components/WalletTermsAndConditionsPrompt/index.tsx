import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import type { ModalOwnProps } from '@proton/components/components';
import { Prompt } from '@proton/components/components';
import { useNotifications } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';
import walletPlaneImg from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';
import { acceptTermsAndConditions, useWalletApiClients } from '@proton/wallet';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { APP_NAME } from '../../config';
import { useWalletDispatch } from '../../store/hooks';

const termsLink = `${getAppStaticUrl(APP_NAME)}/legal/terms`;

interface TermsAndConditionsProps {
    email?: string;
}

type Props = ModalOwnProps & TermsAndConditionsProps;

export const WalletTermsAndConditionsPrompt = ({ email, ...modalProps }: Props) => {
    const walletApi = useWalletApiClients();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const dispatch = useWalletDispatch();

    const handleAcceptConditions = async () => {
        try {
            await walletApi.settings.acceptTermsAndConditions();
            createNotification({ text: c('Wallet terms and conditions').t`Terms and conditions were accepted` });
            dispatch(acceptTermsAndConditions());
        } catch (e) {
            createNotification({ text: c('Wallet terms and conditions').t`Could not accept terms and conditions` });
        }
    };

    const termsAndConditionsLink = <Href className="" href={termsLink}>{`terms and conditions`}</Href>;

    return (
        <Prompt
            size="large"
            footnote={c('Wallet Upgrade').jt`By continuing, you agree to our ${termsAndConditionsLink}`}
            buttons={
                <Button
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                    className="block pb-0"
                    disabled={loading}
                    onClick={() => {
                        void withLoading(handleAcceptConditions());
                    }}
                >{c('Wallet').t`Continue`}</Button>
            }
            {...modalProps}
        >
            <div className="flex flex-column items-center text-center">
                <img
                    src={walletPlaneImg}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '240px', '--h-custom': '135px' }}
                />
                <h1 className="my-3 text-semibold text-3xl">{c('Wallet Welcome').t`Welcome to ${WALLET_APP_NAME}`}</h1>
                <ModalParagraph prompt>
                    {/* need to update text bc it is different for auto created wallet and first created wallet */}
                    <p>{c('Wallet Terms and Conditions')
                        .t`This is a self-custodial Bitcoin wallet, meaning any BTC you buy or receive will be fully controlled by you. Not even ${BRAND_NAME} can seize your assets.`}</p>
                    <p>{c('Wallet Terms and Conditions')
                        .t`To avoid losing assets due to forgetting your password or other access issues, back up your ${BRAND_NAME} recovery phrase and wallet seed phrase.`}</p>
                    {email && (
                        <p>{c('Wallet Terms and Conditions')
                            .t`Bitcoin via Email lets other ${WALLET_APP_NAME} users send BTC to you using your email ${email} (you can change this in wallet settings).`}</p>
                    )}
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
