import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import { Card } from '@proton/atoms/Card';

import { Button } from '../../../atoms';

interface Props {
    mnemonic: WasmMnemonic;
    onContinue: () => void;
}

export const MnemonicBackup = ({ mnemonic, onContinue }: Props) => {
    const mnemonicWords = mnemonic?.asWords();

    return (
        <div className="flex flex-column">
            <Card rounded bordered={false} className="flex flex-row justify-center">
                {mnemonicWords?.map((word, index) => (
                    // TODO: use Pills component here
                    <span
                        className="block m-2 p-1 px-2 rounded text-sm"
                        key={`${index}_${word}`}
                        style={{
                            background: 'var(--signal-info-minor-1)',
                            color: 'var(--signal-info-major-3)',
                        }}
                    >
                        {index + 1}. {word}
                    </span>
                ))}
            </Card>

            <p className="block text-center color-weak">{c('Wallet setup')
                .t`Save these ${mnemonicWords.length} words securely and never share them with anyone.`}</p>

            <Button pill className="block w-4/5 mx-auto mb-2" shape="solid" color="norm" onClick={() => onContinue()}>
                {c('Wallet setup').t`Continue`}
            </Button>
        </div>
    );
};
