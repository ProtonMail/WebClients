import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { useNotifications } from '../../hooks';
import { Copy, InputFieldTwo, TextAreaTwo, Button } from '../../components';

export const MnemonicPhraseStepContent = ({ mnemonic }: { mnemonic: string }) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    return (
        <>
            <p className="mt0">{c('Info').t`Your recovery phrase is a series of 12 words in a specific order.`}</p>
            <p>
                {c('Info')
                    .t`Please write your recovery phrase down in the order it appears and keep it somewhere safe. Your recovery phrase can be used to fully recover access to your account and your encrypted messages.`}
            </p>

            <InputFieldTwo
                id="mnemonic"
                bigger
                as={TextAreaTwo}
                rows={3}
                readOnly
                label={c('Label').t`Recovery phrase`}
                placeholder={c('Label').t`Your recovery phrase`}
                value={mnemonic}
                autoFocus
                hint={<Copy value={mnemonic} onCopy={onCopy} />}
            />
        </>
    );
};

interface MnemonicPhraseStepButtonsProps {
    mnemonic: string;
    onDone: () => void;
}

export const MnemonicPhraseStepButtons = ({ mnemonic, onDone }: MnemonicPhraseStepButtonsProps) => {
    const handleDownload = async () => {
        const blob = new Blob([mnemonic], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `proton_recovery_phrase.txt`);
    };

    return (
        <div className="w100">
            <Button onClick={handleDownload} fullWidth color="norm">
                {c('Action').t`Download`}
            </Button>
            <Button className="mt1" onClick={onDone} fullWidth>
                {c('Action').t`Done`}
            </Button>
        </div>
    );
};
