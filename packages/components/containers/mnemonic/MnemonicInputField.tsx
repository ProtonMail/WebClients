import { useEffect, useState } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { validateMnemonic } from '@proton/shared/lib/mnemonic';

import type { InputFieldProps } from '../../components/v2/field/InputField';

export const useMnemonicInputValidation = (
    mnemonic: string,
    {
        invalidFormatError = c('Error').t`Wrong recovery phrase. Try again or use another recovery method.`,
    }: { invalidFormatError?: string } = {}
) => {
    const [mnemonicError, setMnemonicError] = useState('');

    useEffect(() => {
        validateMnemonic(mnemonic)
            .then((isValid) => setMnemonicError(!isValid ? invalidFormatError : ''))
            .catch(() => setMnemonicError(''));
    }, [mnemonic]);

    return [
        (() => {
            const splitWords = mnemonic.split(/\s+/);
            return splitWords.length !== 12 ? invalidFormatError : '';
        })(),
        (() => {
            return mnemonicError;
        })(),
    ];
};

interface Props extends Omit<InputFieldProps<typeof TextAreaTwo>, 'as'> {}

const MnemonicInputField = ({
    id = 'mnemonic',
    bigger = true,
    rows = 3,
    label = c('Label').t`Recovery phrase`,
    assistiveText = c('Label').t`Phrase consists of 12 unique words in a specific order`,
    onValue,
    ...rest
}: Props) => {
    return (
        <InputFieldTwo
            id={id}
            bigger={bigger}
            as={TextAreaTwo}
            rows={rows}
            label={label}
            assistiveText={assistiveText}
            onValue={(newValue: string) => {
                const splitWords = newValue.split(/\s+/);
                const mnemonic = splitWords.slice(0, 12).join(' ');
                return onValue?.(mnemonic);
            }}
            {...rest}
        />
    );
};

export default MnemonicInputField;
