import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useConfig from '@proton/components/hooks/useConfig';

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
