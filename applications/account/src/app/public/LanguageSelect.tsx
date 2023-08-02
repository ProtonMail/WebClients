import { useHistory } from 'react-router-dom';

import { Button, ButtonLike } from '@proton/atoms';
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown, useConfig, useForceRefresh } from '@proton/components';
import { localeCode } from '@proton/shared/lib/i18n';
import { getBrowserLocale, getClosestLocaleCode, getLanguageCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import clsx from '@proton/utils/clsx';

import { getLocaleMapping } from '../locales';
import useLocationWithoutLocale, { getLocalePathPrefix } from '../useLocationWithoutLocale';

interface Props {
    className?: string;
    style?: React.CSSProperties;
    outlined?: boolean;
    globe?: boolean;
    locales?: TtagLocaleMap;
}

const LanguageSelect = ({ className, style, locales = {}, outlined, globe }: Props) => {
    const { LOCALES = {} } = useConfig();
    const forceRefresh = useForceRefresh();
    const location = useLocationWithoutLocale();
    const history = useHistory();

    const handleChange = async (newLocale: string) => {
        const localeCode = getClosestLocaleCode(newLocale, locales);
        await Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, getBrowserLocale())]);
        forceRefresh();
        history.push(`${getLocalePathPrefix(getLocaleMapping(localeCode) || '')}${location.pathname}`);
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
                    <Icon className="mr-2 flex-item-noshrink no-tiny-mobile" name="globe" />
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
                color="norm"
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
            color="norm"
            content={content}
            className={clsx(className, 'language-dropdown')}
            style={style}
        >
            {menu}
        </SimpleDropdown>
    );
};

export default LanguageSelect;
