import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount, getWordsAutocomplete } from '@proton/andromeda';
import { Alert, Autocomplete, Icon } from '@proton/components/components';

import { Button, Select } from '../../../atoms';

import './MnemonicInput.scss';

const wordCountToNumber: Record<WasmWordCount, number> = {
    [WasmWordCount.Words12]: 12,
    [WasmWordCount.Words15]: 15,
    [WasmWordCount.Words18]: 18,
    [WasmWordCount.Words21]: 21,
    [WasmWordCount.Words24]: 24,
};

const initWords = (wordCount: WasmWordCount) => new Array(wordCountToNumber[wordCount]).fill(null);

interface Props {
    onContinue: (mnemonic: WasmMnemonic) => void;
}

const MNEMONIC_LENGTH_OPTIONS = [
    WasmWordCount.Words12,
    WasmWordCount.Words15,
    WasmWordCount.Words18,
    WasmWordCount.Words21,
    WasmWordCount.Words24,
];

export const MnemonicInput = ({ onContinue }: Props) => {
    const [wordCount, setWordCount] = useState<WasmWordCount>(WasmWordCount.Words12);
    const [words, setWords] = useState<(string | null)[]>(initWords(wordCount));

    const setWord = (value: string, index: number) => {
        setWords((prev) => {
            const cloned = [...prev];
            cloned[index] = value;
            return cloned;
        });
    };

    const mnemonic = useMemo(() => {
        if (words.some((word) => !word)) {
            return null;
        }

        try {
            const parsed = WasmMnemonic.fromString(words.join(' '));
            return { mnemonic: parsed };
        } catch {
            return { mnemonic: null, isInvalid: true };
        }
    }, [words]);

    const handleFillFromClipboard = useCallback(() => {
        void navigator.clipboard.readText().then((text) => {
            const pastedWords = text.split(' ');
            setWords((prev) => [...prev].map((word, index) => pastedWords[index] ?? word));
        });
    }, []);

    return (
        <div className="flex flex-column flex-nowrap">
            <div className="flex flex-column my-3">
                <div className="flex flex-row flex-wrap justify-center">
                    {words.map((word, index) => (
                        <div key={`word-${index + 1}`} className="relative w-1/4 mx-1 mt-2">
                            <span className="word-index rounded-50 absolute top-0 right-0 color-invert text-center text-2xs">
                                {(index + 1).toString()}
                            </span>
                            <Autocomplete
                                id={`word-autocomplete-${index + 1}`}
                                placeholder={`Word ${index + 1}`}
                                value={word ?? ''}
                                onChange={(value): void => setWord(value.trim(), index)}
                                onSelect={({ value }): void => setWord(value.trim(), index)}
                                searchMinLength={1}
                                options={getWordsAutocomplete(word ?? '').map((word) => ({
                                    value: word,
                                    label: word,
                                }))}
                                getData={({ label }) => label}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex flex-row items-center mt-4 justify-space-between">
                    <div className="flex flex-row items-center">
                        <div>
                            <Select
                                id="word-count-selector"
                                label={c('Wallet setup').t`Mnemonic length`}
                                value={wordCount}
                                onChange={({ value: v }) => {
                                    setWordCount(v);
                                    setWords((prev) => initWords(v).map((_, index) => prev[index] ?? null));
                                }}
                                options={MNEMONIC_LENGTH_OPTIONS.map((opt) => ({
                                    label: wordCountToNumber[opt].toString(),
                                    value: opt,
                                    id: opt.toString(),
                                }))}
                            ></Select>
                        </div>
                    </div>

                    <div>
                        <Button onClick={() => handleFillFromClipboard()}>
                            <Icon className="mr-1" name="paper-clip" />
                            {c('Wallet Setup').t`Fill from clipboard`}
                        </Button>
                    </div>
                </div>
            </div>

            {mnemonic?.isInvalid && (
                <Alert type="error" className="mt-4">{c('Wallet setup')
                    .t`Input mnemonic is invalid, please double check.`}</Alert>
            )}

            <Button
                pill
                shape="solid"
                color="norm"
                disabled={!mnemonic?.mnemonic}
                onClick={() => {
                    if (mnemonic?.mnemonic) {
                        onContinue(mnemonic.mnemonic);
                    }
                }}
                className="mt-4"
            >{c('Wallet setup').t`Continue`}</Button>
        </div>
    );
};
