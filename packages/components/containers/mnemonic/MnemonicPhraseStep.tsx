import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import useNotifications from '@proton/components/hooks/useNotifications';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

export const MnemonicPhraseStepContent = ({
    recoveryPhrase,
    loading,
    children,
}: {
    recoveryPhrase?: string;
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

            {!recoveryPhrase || loading ? (
                <Loader />
            ) : (
                <>
                    <span className="text-semibold">{c('Label').t`Recovery phrase`}</span>
                    <Card className="mt-2 flex justify-space-between items-center flex-nowrap" bordered={false} rounded>
                        <span className="mr-2" data-testid="account:recovery:generatedRecoveryPhrase">
                            {recoveryPhrase}
                        </span>
                        <Copy className="bg-norm shrink-0" value={recoveryPhrase} onCopy={onCopy} />
                    </Card>
                </>
            )}
        </>
    );
};

interface MnemonicPhraseStepButtonsProps {
    recoveryPhrase?: string;
    disabled?: boolean;
    onDone?: () => void;
}
export const MnemonicPhraseStepButtons = ({ recoveryPhrase, disabled, onDone }: MnemonicPhraseStepButtonsProps) => {
    const { createNotification } = useNotifications();

    const handleDownload = async () => {
        if (!recoveryPhrase) {
            return;
        }

        const blob = new Blob([recoveryPhrase], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, `proton_recovery_phrase.txt`);
        createNotification({ text: c('Info').t`Recovery phrase downloaded` });
    };

    return (
        <>
            <Button disabled={!recoveryPhrase || disabled} onClick={onDone}>
                {c('Action').t`Done`}
            </Button>
            <Button disabled={!recoveryPhrase || disabled} onClick={handleDownload} color="norm">
                {c('Action').t`Download`}
            </Button>
        </>
    );
};
