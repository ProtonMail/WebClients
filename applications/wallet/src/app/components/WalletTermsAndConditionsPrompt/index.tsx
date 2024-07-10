import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { ModalOwnProps, Prompt } from '@proton/components/components';
import { BRAND_NAME, WALLET_APP_NAME, WALLET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';
import walletPlaneImg from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { APP_NAME } from '../../config';

interface Props extends ModalOwnProps {
    onAcceptConditions: () => void;
}

const termsLink = `${getAppStaticUrl(APP_NAME)}/legal/terms`;

export const WalletTermsAndConditionsPrompt = ({ onAcceptConditions, ...modalProps }: Props) => {
    const termsAndConditionsLink = <Href className="" href={termsLink}>{c('Wallet T&C Link').t`(${termsLink})`}</Href>;

    return (
        <Prompt
            size="large"
            footnote={c('Wallet Upgrade')
                .jt`By continuing, you agree to our terms and conditions ${termsAndConditionsLink}`}
            buttons={
                <Button
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                    shadow
                    className="block"
                    onClick={modalProps.onClose}
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
                        .t`To avoid loss of assets from forget password or other access issues, back up your ${BRAND_NAME} recovery phrase and ${WALLET_SHORT_APP_NAME} seed phrase.`}</p>
                    <p>{c('Wallet Terms and Conditions')
                        .t`We have also enabled the Bitcoin via Email feature on this wallet so other ${WALLET_APP_NAME} users can easily send BTC to [email].`}</p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
