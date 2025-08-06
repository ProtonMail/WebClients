import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Copy, useErrorHandler, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcEye } from '@proton/icons';
import clsx from '@proton/utils/clsx';

/**
 * Displays the recovery phrase and allows to copy it to the clipboard.
 * Can be used as a fallback if the recovery kit pdf download is not available according to `canUseRecoveryKitPdfDownload`
 */
const CopyRecoveryPhraseContainer = ({
    recoveryPhrase,
    setApiRecoveryPhrase,
    className,
}: {
    recoveryPhrase: string;
    setApiRecoveryPhrase: () => Promise<void>;
    className?: string;
}) => {
    const [loading, withLoading] = useLoading();
    const [isRevealed, setIsRevealed] = useState(false);

    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const handleReveal = async () => {
        try {
            await setApiRecoveryPhrase();
        } catch (error) {
            handleError(error);
            return;
        }

        setIsRevealed(true);
    };

    const onCopy = () => {
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    const blurredTextContent = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor';

    return (
        <div className={clsx('relative rounded-lg border border-solid border-norm p-4 bg-norm', className)}>
            <div
                className="flex justify-space-between items-center flex-nowrap gap-1 pointer-events-none"
                style={{ filter: !isRevealed && 'blur(10px)' }}
            >
                <span className="text-monospace text-bold text-lg user-select">
                    {isRevealed ? recoveryPhrase : blurredTextContent}
                </span>
                {isRevealed ? (
                    <Copy className="bg-norm shrink-0 rounded-full" value={recoveryPhrase} onCopy={onCopy} />
                ) : null}
            </div>

            {!isRevealed && (
                <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                    <Button
                        color="norm"
                        shape="outline"
                        pill
                        className="inline-flex items-center"
                        onClick={() => withLoading(handleReveal)}
                        loading={loading}
                    >
                        <IcEye className="shrink-0 mr-2" />
                        {c('RecoveryPhrase: Action').t`Reveal recovery phrase`}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CopyRecoveryPhraseContainer;
