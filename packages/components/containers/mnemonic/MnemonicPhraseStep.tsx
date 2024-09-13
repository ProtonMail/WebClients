import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { Copy, Loader } from '../../components';
import { useNotifications } from '../../hooks';

export const MnemonicPhraseStepContent = ({
    mnemonic,
    loading,
    children,
}: {
    mnemonic?: string;
    loading?: boolean;
    children?: ReactNode;
}) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    return (
        <>
            {children ? (
                children
            ) : (
                <>
                    <p className="mt-0">
                        {c('Info')
                            .t`Your recovery phrase is a series of 12 randomly generated words in a specific order.`}
                    </p>

                    <p className="color-warning">
                        <Icon className="mr-2 float-left mt-1" name="exclamation-circle-filled" />

                        {c('Info')
                            .t`Please keep it safe. You'll need it to access your account and decrypt your data in case of a password reset.`}
                    </p>
                </>
            )}

            {!mnemonic || loading ? (
                <Loader />
            ) : (
                <>
                    <span className="text-semibold">{c('Label').t`Recovery phrase`}</span>
                    <Card className="mt-2 flex justify-space-between items-center flex-nowrap" bordered={false} rounded>
                        <span className="mr-2" data-testid="account:recovery:generatedRecoveryPhrase">
                            {mnemonic}
                        </span>
                        <Copy className="bg-norm shrink-0" value={mnemonic} onCopy={onCopy} />
                    </Card>
                </>
            )}
        </>
    );
};

interface MnemonicPhraseStepButtonsProps {
    mnemonic?: string;
    disabled?: boolean;
    onDone?: () => void;
}
export const MnemonicPhraseStepButtons = ({ mnemonic, disabled, onDone }: MnemonicPhraseStepButtonsProps) => {
    const { createNotification } = useNotifications();

    const handleDownload = async () => {
        if (!mnemonic) {
            return;
        }

        const blob = new Blob([mnemonic], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `proton_recovery_phrase.txt`);
        createNotification({ text: c('Info').t`Recovery phrase downloaded` });
    };

    return (
        <>
            <Button disabled={!mnemonic || disabled} onClick={onDone}>
                {c('Action').t`Done`}
            </Button>
            <Button disabled={!mnemonic || disabled} onClick={handleDownload} color="norm">
                {c('Action').t`Download`}
            </Button>
        </>
    );
};
