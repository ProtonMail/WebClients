import type { CSSProperties } from 'react';
import { useHistory } from 'react-router-dom';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';
import { DropdownMenu, DropdownMenuButton, SimpleDropdown, useConfig, useForceRefresh } from '@proton/components';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { localeCode } from '@proton/shared/lib/i18n';
import { getLanguageCode } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import clsx from '@proton/utils/clsx';

import { getLocaleMapping } from '../locales';
import useLocationWithoutLocale, { getLocalePathPrefix } from '../useLocationWithoutLocale';

interface Props {
    className?: string;
    style?: CSSProperties;
    outlined?: boolean;
    globe?: boolean;
    locales?: TtagLocaleMap;
    color?: ThemeColorUnion;
}

const LanguageSelect = ({ className, style, locales = {}, outlined, globe, color = 'norm' }: Props) => {
    const { LOCALES = {} } = useConfig();
    const forceRefresh = useForceRefresh();
    const location = useLocationWithoutLocale();
    const history = useHistory();

    const handleChange = async (locale: string) => {
        const { localeCode } = await loadLocales({ locale, locales, userSettings: undefined });
        forceRefresh();
        history.push(
            `${getLocalePathPrefix(getLocaleMapping(localeCode) || '')}${location.pathname}${location.search}${
                location.hash
            }`
        );
    };

    const menu = (
        <DropdownMenu>
            {Object.keys(LOCALES).map((value) => (
                <DropdownMenuButton
                    className="text-left"
                    lang={getLanguageCode(value)}
                    key={value}
                    onClick={() => handleChange(value)}
                >
                    {LOCALES[value]}
                </DropdownMenuButton>
            ))}
        </DropdownMenu>
    );

    const content = (
        <>
            {globe && (
                <>
                    <IcGlobe className="mr-2 shrink-0 hidden sm:inline-block" />
                </>
            )}
            <span className="text-ellipsis" lang={getLanguageCode(localeCode)}>
                {LOCALES[localeCode]}
            </span>
        </>
    );

    if (outlined) {
        return (
            <SimpleDropdown
                as={ButtonLike}
                shape="outline"
                size="small"
                color={color}
                type="button"
                content={content}
                className={className}
                style={style}
            >
                {menu}
            </SimpleDropdown>
        );
    }

    return (
        <SimpleDropdown
            as={Button}
            shape="ghost"
            size="small"
            color={color}
            content={content}
            className={clsx(className, 'language-dropdown')}
            style={style}
        >
            {menu}
        </SimpleDropdown>
    );
};

export default LanguageSelect;
