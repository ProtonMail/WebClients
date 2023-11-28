import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { WalletLogo } from '@proton/components/components';

import { WalletSetupMode } from '../type';

interface Props {
    onModeSelection: (mode: WalletSetupMode) => void;
}

export const SetupModeSelect = ({ onModeSelection }: Props) => {
    return (
        <div className="pb-8">
            <div className="flex flex-column colored-gradient-card py-12">
                <span className="block color-white mx-auto mb-2 text-semibold">{c('Wallet setup').t`Welcome to`}</span>
                <WalletLogo className="mx-auto" />
            </div>

            <p className="text-bold text-center mb-2">
                {c('Wallet setup').t`Financial freedom with rock-solid security and privacy`}
            </p>
            <p className="mt-0 mb-8 w-3/5 mx-auto text-center">{c('Wallet setup')
                .t`Get started and create a brand new wallet or import an existing one.`}</p>

            <Button
                className="block w-4/5 mx-auto mt-6 mb-2"
                color="norm"
                onClick={() => onModeSelection(WalletSetupMode.Creation)}
            >{c('Wallet setup').t`Create a new wallet`}</Button>
            <Button className="block w-4/5 mx-auto" onClick={() => onModeSelection(WalletSetupMode.Import)}>{c(
                'Wallet setup'
            ).t`Import an existing wallet`}</Button>
        </div>
    );
};
