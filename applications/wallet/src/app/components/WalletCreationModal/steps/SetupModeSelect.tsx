import { c } from 'ttag';

import { Button } from '../../../atoms';
import { WalletSetupScheme } from '../../../hooks/useWalletSetup/type';

interface Props {
    onModeSelection: (mode: WalletSetupScheme.ManualCreation | WalletSetupScheme.WalletImport) => void;
}

export const SetupModeSelect = ({ onModeSelection }: Props) => {
    return (
        <div className="w-full flex">
            <Button
                pill
                className="block w-4/5 mx-auto mb-2"
                shape="solid"
                color="norm"
                onClick={() => onModeSelection(WalletSetupScheme.ManualCreation)}
            >{c('Wallet setup').t`Create a new wallet`}</Button>
            <Button
                className="block w-4/5 mx-auto"
                shape="ghost"
                color="weak"
                onClick={() => onModeSelection(WalletSetupScheme.WalletImport)}
            >{c('Wallet setup').t`Import an existing wallet`}</Button>
        </div>
    );
};
