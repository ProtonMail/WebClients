import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import type { Nullable } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { SelectTwo } from '../../../components';
import { useConfig, useUserSettings } from '../../../hooks';

interface Props {
    id: string;
    className?: string;
    loading: boolean;
    disabled?: boolean;
    locale: Nullable<string>;
    locales: TtagLocaleMap;
    onChange: (locale: Nullable<string>) => void;
}

const InviteLocaleSelector = ({
    className = 'field w-full',
    loading = false,
    disabled = false,
    locale,
    locales,
    onChange,
    ...rest
}: Props) => {
    const { LOCALES = {} } = useConfig();
    const [userSettings] = useUserSettings();

    const defaultLanguage = LOCALES[getClosestLocaleCode(userSettings?.Locale, locales)];
    const options: { text: string; value: Nullable<string> }[] = Object.keys(LOCALES).map((value) => ({
        text: LOCALES[value],
        value,
    }));

    options.unshift({
        text: c('Label').t`Default language (${defaultLanguage})`,
        value: null,
    });

    const handleChange = async (locale: Nullable<string>) => {
        const localeCode = locale === null ? null : getClosestLocaleCode(locale, locales);
        onChange(localeCode);
    };

    return (
        <SelectTwo
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select language for invitation emails`}
            value={locale}
            onChange={({ value }) => handleChange(value)}
            {...rest}
        >
            {options.map(({ text, value }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default InviteLocaleSelector;
