import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcEye, IcSquares } from '@proton/icons';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

/**
 * Displays the recovery phrase and allows to copy it to the clipboard.
 * Can be used as a fallback if the recovery kit pdf download is not available according to `canUseRecoveryKitPdfDownload`
 */
const CopyRecoveryPhraseContainer = ({
    recoveryPhrase,
    sendPayload,
    className,
    hasSentPayload,
}: {
    recoveryPhrase: string;
    sendPayload: () => Promise<void>;
    className?: string;
    hasSentPayload: boolean;
}) => {
    const [loading, withLoading] = useLoading();

    const { createNotification } = useNotifications();

    const onCopy = () => {
        textToClipboard(recoveryPhrase);
        createNotification({ text: c('Info').t`Recovery phrase copied to clipboard` });
    };

    const hiddenTextContent = '•••• •••••••• ••••• •••••• ••• •••••• •••• •••••••• •••• •••••• ••• •••• ••••••';

    return (
        <div className={clsx('flex gap-4 flex-nowrap items-center', className)}>
            <div className="text-lg">{hasSentPayload ? recoveryPhrase : hiddenTextContent}</div>

            {hasSentPayload ? (
                <Button
                    color="weak"
                    shape="outline"
                    pill
                    className="inline-flex items-center shrink-0"
                    onClick={onCopy}
                >
                    <IcSquares className="shrink-0 mr-2" />
                    {c('RecoveryPhrase: Action').t`Copy`}
                </Button>
            ) : (
                <Button
                    color="norm"
                    pill
                    className="inline-flex items-center shrink-0"
                    onClick={() => withLoading(sendPayload)}
                    disabled={loading}
                    noDisabledStyles
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

export default CopyRecoveryPhraseContainer;
