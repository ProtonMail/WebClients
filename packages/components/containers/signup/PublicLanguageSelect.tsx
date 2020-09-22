import React from 'react';
import { localeCode } from 'proton-shared/lib/i18n';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { DropdownMenu, DropdownMenuButton, SimpleDropdown } from '../../components';
import { useConfig, useForceRefresh } from '../../hooks';

interface Props {
    className?: string;
    locales?: TtagLocaleMap;
}

const PublicLanguageSelect = ({ className, locales = {} }: Props) => {
    const forceRefresh = useForceRefresh();
    const { LOCALES = {} } = useConfig();
    const handleChange = async (newLocale: string) => {
        const localeCode = getClosestLocaleCode(newLocale, locales);
        await Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, getBrowserLocale())]);
        forceRefresh();
    };
    const languages = Object.keys(LOCALES).map((value) => (
        <DropdownMenuButton className="alignleft" key={value} onClick={() => handleChange(value)}>
            {LOCALES[value]}
        </DropdownMenuButton>
    ));

    return (
        <SimpleDropdown content={LOCALES[localeCode]} className={className}>
            <DropdownMenu>{languages}</DropdownMenu>
        </SimpleDropdown>
    );
};

export default PublicLanguageSelect;
