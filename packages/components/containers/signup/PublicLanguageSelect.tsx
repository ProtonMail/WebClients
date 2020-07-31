import React from 'react';
import { localeCode } from 'proton-shared/lib/i18n';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import { getBrowserLocale, getClosestMatches } from 'proton-shared/lib/i18n/helper';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { DropdownMenu, DropdownMenuButton, useForceRefresh, useConfig, SimpleDropdown } from '../../index';

interface Props {
    className?: string;
    locales?: TtagLocaleMap;
}

const PublicLanguageSelect = ({ className, locales = {} }: Props) => {
    const forceRefresh = useForceRefresh();
    const { LOCALES = {} } = useConfig();
    const handleChange = async (newLocale: string) => {
        const matches = getClosestMatches({
            locale: newLocale,
            browserLocale: getBrowserLocale(),
            locales,
        });
        await loadLocale({
            ...matches,
            locales,
        });
        forceRefresh();
    };
    const languages = Object.keys(LOCALES).map((value) => (
        <DropdownMenuButton key={value} onClick={() => handleChange(value)}>{LOCALES[value]}</DropdownMenuButton>
    ));

    return (
        <SimpleDropdown content={LOCALES[localeCode]} className={className}>
            <DropdownMenu>{languages}</DropdownMenu>
        </SimpleDropdown>
    );
};

export default PublicLanguageSelect;
