import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount, getWordsAutocomplete } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { Alert, Autocomplete, Icon, Option, SelectTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

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
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column flex-nowrap">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Input your mnemonic`}</span>

                <p className="block text-center color-weak">{c('Wallet setup')
                    .t`We will encrypt it and store on our server, so that can access your wallet on all platform you are logged in`}</p>

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
                            <label className="mr-2" htmlFor="word-count-selector">
                                {c('Wallet Setup').t`Word count`}
                            </label>

                            <div>
                                <SelectTwo
                                    id="word-count-selector"
                                    value={wordCount}
                                    onChange={({ value: v }) => {
                                        setWordCount(v);
                                        setWords((prev) => initWords(v).map((_, index) => prev[index] ?? null));
                                    }}
                                >
                                    {[
                                        WasmWordCount.Words12,
                                        WasmWordCount.Words15,
                                        WasmWordCount.Words18,
                                        WasmWordCount.Words21,
                                        WasmWordCount.Words24,
                                    ].map((wordCount) => (
                                        <Option
                                            key={`option-${wordCount}`}
                                            title={wordCountToNumber[wordCount].toString()}
                                            value={wordCount}
                                        />
                                    ))}
                                </SelectTwo>
                            </div>
                        </div>

                        <Button onClick={() => handleFillFromClipboard()}>
                            <Icon className="mr-1" name="paper-clip" />
                            {c('Wallet Setup').t`Fill from clipboard`}
                        </Button>
                    </div>
                </div>

                {mnemonic?.isInvalid && (
                    <Alert type="error" className="mt-4">{c('Wallet setup')
                        .t`Input mnemonic is invalid, please double check.`}</Alert>
                )}

                <Button
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
        </ModalContent>
    );
};
