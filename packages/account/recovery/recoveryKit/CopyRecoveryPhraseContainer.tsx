import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcEye } from '@proton/icons/icons/IcEye';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import clsx from '@proton/utils/clsx';

/**
 * Displays the recovery phrase and allows to copy it to the clipboard.
 * Can be used as a fallback if the recovery kit pdf download is not available according to `canUseRecoveryKitPdfDownload`
 */
export const CopyRecoveryPhraseContainer = ({
    recoveryPhrase,
    onCopyPhrase,
    className,
    hasSentPayload,
    loading,
}: {
    recoveryPhrase: string;
    onCopyPhrase: () => void;
    className?: string;
    hasSentPayload: boolean;
    loading: boolean;
}) => {
    const hiddenTextContent = '•••• •••••••• ••••• •••••• ••• •••••• •••• •••••••• •••• •••••• ••• •••• ••••••';

    return (
        <div className={clsx('flex gap-4 flex-nowrap items-center', className)}>
            <div
                className="text-lg"
                data-testid={hasSentPayload ? 'account:recovery:generatedRecoveryPhrase' : undefined}
            >
                {hasSentPayload ? recoveryPhrase : hiddenTextContent}
            </div>

            {hasSentPayload ? (
                <Button
                    color="weak"
                    shape="outline"
                    pill
                    className="inline-flex items-center shrink-0"
                    onClick={onCopyPhrase}
                    data-testid="copy-recovery-phrase"
                >
                    <IcSquares className="shrink-0 mr-2" />
                    {c('RecoveryPhrase: Action').t`Copy`}
                </Button>
            ) : (
                <Button
                    color="norm"
                    pill
                    className="inline-flex items-center shrink-0"
                    onClick={onCopyPhrase}
                    disabled={loading}
                    noDisabledStyles
                    data-testid="copy-recovery-phrase"
                >
                    {loading ? (
                        <CircleLoader
                            size="small"
                            className="shrink-0 mr-2"
                            style={{
                                // Ensure alignment stays the same when switching between loading states
                                marginLeft: 2,
                            }}
                        />
                    ) : (
                        <IcEye className="shrink-0 mr-2" />
                    )}
                    {c('RecoveryPhrase: Action').t`Show`}
                </Button>
            )}
        </div>
    );
};
