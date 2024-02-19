import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { WalletLogo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { WalletSetupMode } from '../type';

interface Props {
    isFirstSetup?: boolean;
    onModeSelection: (mode: WalletSetupMode) => void;
}

export const SetupModeSelect = ({ isFirstSetup, onModeSelection }: Props) => {
    return (
        <>
            {!isFirstSetup && (
                <ModalHeader
                    title={c('Wallet setup').t`Setup a new wallet`}
                    subline={c('Wallet setup').t`Import or create a new wallet into ${WALLET_APP_NAME}`}
                />
            )}

            <ModalContent className="p-0 m-0 pb-8 flex">
                {isFirstSetup && (
                    <>
                        <div className="ui-prominent flex flex-column colored-gradient-card py-12 w-full">
                            <span className="block mx-auto mb-2 text-semibold">{c('Wallet setup').t`Welcome to`}</span>
                            <WalletLogo className="mx-auto" />
                        </div>

                        <p className="text-bold mx-auto text-center mb-2">
                            {c('Wallet setup').t`Financial freedom with rock-solid security and privacy`}
                        </p>
                        <p className="my-0 w-3/5 mx-auto text-center">{c('Wallet setup')
                            .t`Get started and create a brand new wallet or import an existing one.`}</p>
                    </>
                )}

                <div className="pt-10 w-full flex">
                    <Button
                        className="block w-4/5 mx-auto mb-2"
                        color="norm"
                        onClick={() => onModeSelection(WalletSetupMode.Creation)}
                    >{c('Wallet setup').t`Create a new wallet`}</Button>
                    <Button className="block w-4/5 mx-auto" onClick={() => onModeSelection(WalletSetupMode.Import)}>{c(
                        'Wallet setup'
                    ).t`Import an existing wallet`}</Button>
                </div>
            </ModalContent>
        </>
    );
};
