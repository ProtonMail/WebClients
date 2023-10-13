import { type VFC } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';

type Props = {
    value: string;
    onChange: (locale: string) => void;
};

export const LocaleSelect: VFC<Props> = ({ value, onChange }) => {
    const { LOCALES } = useConfig();

    return (
        <SelectTwo<string> placeholder={c('Label').t`Select preferred language`} onValue={onChange} value={value}>
            {Object.keys(LOCALES).map((locale) => (
                <Option key={locale} title={LOCALES[locale]} value={locale} />
            ))}
        </SelectTwo>
    );
};
