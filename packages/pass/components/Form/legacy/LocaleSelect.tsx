import type { FC } from 'react';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

type Props = {
    value?: string;
    onChange: (locale: string) => void;
};

export const LocaleSelect: FC<Props> = ({ value, onChange }) => {
    const { LOCALES } = useConfig();

    return (
        <SelectTwo<string> placeholder={c('Label').t`Select preferred language`} onValue={onChange} value={value}>
            {Object.keys(LOCALES).map((locale) => (
                <Option key={locale} title={LOCALES[locale]} value={locale} />
            ))}
        </SelectTwo>
    );
};
