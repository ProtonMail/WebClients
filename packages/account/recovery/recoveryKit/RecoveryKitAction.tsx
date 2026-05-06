import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { RECOVERY_KIT_FILE_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import recoveryKitPdf from '@proton/styles/assets/img/illustrations/recovery-kit-pdf.svg';
import clsx from '@proton/utils/clsx';

import { CopyRecoveryPhraseContainer } from './CopyRecoveryPhraseContainer';
import type { DeferredMnemonicData } from './generateDeferredMnemonicData';

type Method = 'recovery-kit' | 'text';

export interface RecoveryKitActionProps {
    recoveryKitData: DeferredMnemonicData;
    onSaveRecoveryKit: (type: 'copy' | 'download', recoveryKitData: DeferredMnemonicData) => void;
    method: Method;
    loading: boolean;
    cardClasses?: string;
}

const BaseRecoveryKitAction = ({
    recoveryKitData,
    onSaveRecoveryKit,
    method,
    loading,
    cardClasses = 'rounded-lg border border-solid border-norm shadow-raised bg-norm',
}: RecoveryKitActionProps) => {
    const {
        hasSentPayload,
        recoveryPhrase,
        save: { canDownloadRecoveryKit, recoveryKitBytes },
    } = recoveryKitData;

    if (!canDownloadRecoveryKit || method === 'text') {
        /**
         * Fallback to copy functionality
         */
        return (
            <CopyRecoveryPhraseContainer
                className={clsx(cardClasses, 'p-4 md:p-8 ')}
                recoveryPhrase={recoveryPhrase}
                loading={loading}
                onCopyPhrase={() => {
                    onSaveRecoveryKit('copy', recoveryKitData);
                }}
                hasSentPayload={hasSentPayload}
            />
        );
    }

    const size = humanSize({ bytes: recoveryKitBytes });

    return (
        <div className={clsx(cardClasses, 'p-4 md:p-5 md:pr-8 flex items-center gap-3 md:gap-6')}>
            <div>
                <img
                    src={recoveryKitPdf}
                    alt=""
                    width={84}
                    height={120}
                    className="max-w-custom"
                    loading="lazy"
                    style={{ '--max-w-custom': '15vw' }}
                />
            </div>
            <div className="flex-1">
                <div className="text-lg text-bold">{c('RecoveryPhrase: Info').t`Download PDF`}</div>
                <div className="color-weak text-sm md:text-rg">{RECOVERY_KIT_FILE_NAME}</div>
                <div className="color-weak text-xs md:text-sm">{size}</div>
            </div>
            <Button
                color={hasSentPayload ? 'weak' : 'norm'}
                shape={hasSentPayload ? 'outline' : 'solid'}
                icon
                pill
                size="large"
                onClick={() => {
                    onSaveRecoveryKit('download', recoveryKitData);
                }}
                loading={loading}
                data-testid="download-recovery-kit-button"
            >
                <IcArrowDownLine size={6} />
            </Button>
        </div>
    );
};

export const RecoveryKitAction = (props: Omit<RecoveryKitActionProps, 'method'>) => {
    const [method, setMethod] = useState<Method>('recovery-kit');

    const copyRecoverySwitchButton = (
        <InlineLinkButton
            key="copy-recovery-phrase-button"
            data-testid="switch-to-copy"
            onClick={() => {
                setMethod('text');
            }}
        >
            {
                // translator: Full sentence "Or copy recovery phrase as text."
                c('RecoveryPhrase: Info').t`copy recovery phrase`
            }
        </InlineLinkButton>
    );

    const downloadRecoveryKitSwitchButton = (
        <InlineLinkButton
            key="download-pdf-button"
            data-testid="switch-to-pdf"
            onClick={() => {
                setMethod('recovery-kit');
            }}
        >
            {
                // translator: Full sentence "Or download PDF instead."
                c('RecoveryPhrase: Info').t`download PDF`
            }
        </InlineLinkButton>
    );

    const { recoveryKitData } = props;
    return (
        <div className="flex flex-column gap-2">
            <BaseRecoveryKitAction {...props} method={method} />
            {recoveryKitData.save.canDownloadRecoveryKit && (
                <div>
                    {method === 'recovery-kit' &&
                        // translator: Full sentence "Or copy recovery phrase as text."
                        c('RecoveryPhrase: Info').jt`Or ${copyRecoverySwitchButton} as text.`}

                    {method === 'text' &&
                        // translator: Full sentence "Or download PDF instead."
                        c('RecoveryPhrase: Info').jt`Or ${downloadRecoveryKitSwitchButton} instead.`}
                </div>
            )}
        </div>
    );
};
