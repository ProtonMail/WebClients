import { MouseEvent } from 'react';
import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { useNotifications, useUser } from '../../hooks';
import { InputFieldTwo, TextAreaTwo, Button } from '../../components';

export const MnemonicPhraseStepContent = ({ mnemonic }: { mnemonic: string }) => {
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
            />
        </>
    );
};

export const MnemonicPhraseStepButtons = ({ mnemonic }: { mnemonic: string }) => {
    const [{ Name }] = useUser();
    const { createNotification } = useNotifications();

    const handleDownload = async () => {
        const blob = new Blob([mnemonic], { type: 'data:text/plain;charset=utf-8;' });
        downloadFile(blob, `recovery_phrase-${Name}.txt`);
    };

    const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(mnemonic, event.currentTarget);
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    return (
        <div className="w100">
            <Button onClick={handleDownload} fullWidth color="norm">
                {c('Action').t`Download`}
            </Button>
            <Button className="mt1" onClick={handleCopy} fullWidth>
                {c('Action').t`Copy to clipboard`}
            </Button>
        </div>
    );
};
