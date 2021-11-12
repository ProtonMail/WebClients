import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { useNotifications } from '../../hooks';
import { Button, Card, Copy, Icon, Loader } from '../../components';

export const MnemonicPhraseStepContent = ({ mnemonic, loading }: { mnemonic?: string; loading?: boolean }) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    return (
        <>
            <p className="mt0">{c('Info').t`Your recovery phrase is a series of 12 words in a specific order.`}</p>

            <p className="color-danger">
                <Icon className="mr0-5 float-left mt0-25" name="circle-exclamation-filled" />

                {c('Info')
                    .t`Please keep it safe. You'll need it to access your account and decrypt your data in case of a password reset.`}
            </p>

            {!mnemonic || loading ? (
                <Loader />
            ) : (
                <>
                    <span className="text-semibold">{c('Label').t`Recovery phrase`}</span>
                    <Card
                        className="mt0-5 flex flex-justify-space-between flex-align-items-center flex-nowrap"
                        bordered={false}
                        rounded
                    >
                        <span className="mr0-5">{mnemonic}</span>
                        <Copy className="bg-norm flex-item-noshrink" value={mnemonic} onCopy={onCopy} />
                    </Card>
                </>
            )}
        </>
    );
};

interface MnemonicPhraseStepButtonsProps {
    mnemonic?: string;
    disabled?: boolean;
    onDone: () => void;
}
export const MnemonicPhraseStepButtons = ({ mnemonic, disabled, onDone }: MnemonicPhraseStepButtonsProps) => {
    const handleDownload = async () => {
        if (!mnemonic) {
            return;
        }

        const blob = new Blob([mnemonic], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `proton_recovery_phrase.txt`);
    };

    return (
        <div className="w100">
            <Button disabled={!mnemonic || disabled} onClick={handleDownload} fullWidth color="norm">
                {c('Action').t`Download`}
            </Button>
            <Button className="mt1" disabled={!mnemonic || disabled} onClick={onDone} fullWidth>
                {c('Action').t`Done`}
            </Button>
        </div>
    );
};
