import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount } from '@proton/andromeda';
import { TextAreaTwo } from '@proton/components/components';

import { Button, Input } from '../../../atoms';
import { ImportantNotice } from './ImportantNotice';

import './MnemonicInput.scss';

const wordCountToNumber: Record<WasmWordCount, number> = {
    [WasmWordCount.Words12]: 12,
    [WasmWordCount.Words15]: 15,
    [WasmWordCount.Words18]: 18,
    [WasmWordCount.Words21]: 21,
    [WasmWordCount.Words24]: 24,
};

interface Props {
    onContinue: (mnemonic: WasmMnemonic) => void;
}

export const MnemonicInput = ({ onContinue }: Props) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string>();

    const parseMnemonic = useCallback((value: string): { mnemonic: WasmMnemonic } | { error: string } => {
        const words = value.trim().split(' ');

        if (!Object.values(wordCountToNumber).includes(words.length)) {
            return { error: c('Wallet setup').t`Mnemonic length is not valid.` };
        }

        try {
            const parsed = WasmMnemonic.fromString(words.join(' '));
            return { mnemonic: parsed };
        } catch {
            return { error: c('Wallet setup').t`Input mnemonic is invalid, please double check.` };
        }
    }, []);

    const handleSubmit = useCallback(() => {
        const result = parseMnemonic(value);

        if ('error' in result) {
            setError(result.error);
        } else {
            onContinue(result.mnemonic);
        }
    }, [value, parseMnemonic, onContinue]);

    useEffect(() => {
        if (error) {
            const result = parseMnemonic(value);
            setError('error' in result ? result.error : undefined);
        }
    }, [error, value, parseMnemonic]);

    return (
        <div className="flex flex-column flex-nowrap">
            <div className="flex flex-column my-3">
                <Input
                    as={TextAreaTwo}
                    rows={3}
                    label="Mnemonic"
                    value={value}
                    onValue={(v: string) => setValue(v)}
                    className="bg-weak"
                    error={error}
                />
            </div>

            <ImportantNotice text={c('Wallet setup').t`Enter your secret recovery phrase in its exact order`} />

            <Button
                pill
                shape="solid"
                color="norm"
                disabled={!value || !!error}
                onClick={() => handleSubmit()}
                className="mt-4"
            >{c('Wallet setup').t`Continue`}</Button>
        </div>
    );
};
