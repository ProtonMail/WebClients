import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletPlaneImg from '@proton/styles/assets/img/wallet/wallet-bitcoin.jpg';
import { acceptTermsAndConditions, useUserWalletSettings, useWalletApiClients } from '@proton/wallet';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useWalletDispatch } from '../../store/hooks';
import { getTermAndConditionsSentence } from '../../utils/legal';

interface WalletWelcomePromptProps {
    email?: string;
}

type Props = ModalOwnProps & WalletWelcomePromptProps;

export const WalletWelcomePrompt = ({ email, ...modalProps }: Props) => {
    const walletApi = useWalletApiClients();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const dispatch = useWalletDispatch();
    const [walletSettings] = useUserWalletSettings();

    const handleContinue = async () => {
        try {
            if (!walletSettings.AcceptTermsAndConditions) {
                await walletApi.settings.acceptTermsAndConditions();
                createNotification({ text: c('Wallet terms and conditions').t`Terms and conditions were accepted` });
                dispatch(acceptTermsAndConditions());
            }

            modalProps.onClose?.();
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Wallet terms and conditions').t`Could not accept terms and conditions`,
            });
        }
    };

    const emailEl = (
        <span key="bve-email" className="text-semibold">
            {email}
        </span>
    );

    return (
        <Prompt
            size="large"
            footnote={walletSettings.AcceptTermsAndConditions ? undefined : getTermAndConditionsSentence()}
            buttons={
                <Button
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                    className="block pb-0"
                    disabled={loading}
                    onClick={() => {
                        void withLoading(handleContinue());
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
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
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
                            .jt`We have created two BTC accounts for you. A primary account, and a second account for receiving Bitcoin via Email (at ${emailEl}) from other ${WALLET_APP_NAME} users.`}</p>
                    )}
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
