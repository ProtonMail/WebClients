import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import type { User } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import type { ThemeInformation, ThemeTypes } from '@proton/shared/lib/themes/themes';

export function getMaybeForcePaymentsVersion(user?: User): PaymentsVersion | undefined {
    return user?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED ? 'v5' : undefined;
}

export type ChargebeeEnabledString = 'inhouse-forced' | 'chargebee-allowed' | 'chargebee-forced';

export function chargebeeEnabledToString(chargebeeEnabled: ChargebeeEnabled): ChargebeeEnabledString {
    switch (chargebeeEnabled) {
        case ChargebeeEnabled.INHOUSE_FORCED:
            return 'inhouse-forced';
        case ChargebeeEnabled.CHARGEBEE_ALLOWED:
            return 'chargebee-allowed';
        case ChargebeeEnabled.CHARGEBEE_FORCED:
            return 'chargebee-forced';
    }
}

type Brightness = 'dark' | 'light';
export type ThemeCode = `${ThemeTypes | undefined}-${Brightness}` | undefined;
export type ThemeLike = Pick<ThemeInformation, 'dark'> & Partial<Pick<ThemeInformation, 'theme'>>;

export function getThemeCode(themeLike?: ThemeLike): ThemeCode {
    if (!themeLike) {
        return undefined;
    }

    const brightness: Brightness = themeLike.dark ? 'dark' : 'light';
    return `${themeLike.theme}-${brightness}`;
}
