import { localeCode } from '@proton/shared/lib/i18n';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { addDays } from 'date-fns';
import {
    useConfig,
    useForceRefresh,
    DropdownMenu,
    DropdownMenuButton,
    SimpleDropdown,
    Icon,
    ButtonLike,
} from '@proton/components';

interface Props {
    className?: string;
    outlined?: boolean;
    globe?: boolean;
    locales?: TtagLocaleMap;
}

const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

const LanguageSelect = ({ className, locales = {}, outlined, globe }: Props) => {
    const { LOCALES = {} } = useConfig();
    const forceRefresh = useForceRefresh();

    const handleChange = async (newLocale: string) => {
        const localeCode = getClosestLocaleCode(newLocale, locales);
        await Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, getBrowserLocale())]);
        setCookie({
            cookieName: 'Locale',
            cookieValue: localeCode,
            expirationDate: addDays(new Date(), 30).toUTCString(),
            cookieDomain,
        });
        forceRefresh();
    };

    const menu = (
        <DropdownMenu>
            {Object.keys(LOCALES).map((value) => (
                <DropdownMenuButton className="text-left" key={value} onClick={() => handleChange(value)}>
                    {LOCALES[value]}
                </DropdownMenuButton>
            ))}
        </DropdownMenu>
    );

    const content = globe ? (
        <>
            <Icon className="mr0-5" name="globe" /> {LOCALES[localeCode]}
        </>
    ) : (
        LOCALES[localeCode]
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
            >
                {menu}
            </SimpleDropdown>
        );
    }

    return (
        <SimpleDropdown as="button" type="button" content={content} className={className}>
            {menu}
        </SimpleDropdown>
    );
};

export default LanguageSelect;
