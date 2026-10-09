import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

import {
    DICTATION_LANGUAGE_AUTO,
    DICTATION_LANGUAGE_CODES,
    type DictationLanguage,
    getDictationLanguageName,
    isDictationLanguage,
} from '../../util/dictationLanguages';

interface Props {
    id?: string;
    value: DictationLanguage;
    onChange: (value: DictationLanguage) => void;
}

export const DictationLanguageSelect = ({ id, value, onChange }: Props) => {
    // SelectTwo requires a flat array of <Option> children (it filters children by type).
    const languageOptions = DICTATION_LANGUAGE_CODES.map((code) => ({
        code,
        name: getDictationLanguageName(code),
    })).sort((a, b) => a.name.localeCompare(b.name));
    const options = [
        <Option key={DICTATION_LANGUAGE_AUTO} value={DICTATION_LANGUAGE_AUTO} title={c('collider_2025: Option').t`Auto-detect`} />,
        ...languageOptions.map(({ code, name }) => <Option key={code} value={code} title={name} />),
    ];

    return (
        <SelectTwo<DictationLanguage>
            id={id}
            value={value}
            onChange={({ value: next }) => {
                if (isDictationLanguage(next)) {
                    onChange(next);
                }
            }}
        >
            {options}
        </SelectTwo>
    );
};
