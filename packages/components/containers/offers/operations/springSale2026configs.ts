import type { OfferConfig, Operation } from '../interface';
import { configuration as drivePlus } from '../operations/springSale2026DrivePlus/configuration';
import { useOffer as useDrivePlus } from '../operations/springSale2026DrivePlus/useOffer';
import { configuration as drivePlusRetention } from '../operations/springSale2026DrivePlusRetention/configuration';
import { useOffer as useDrivePlusRetention } from '../operations/springSale2026DrivePlusRetention/useOffer';
import { configuration as duo } from '../operations/springSale2026Duo/configuration';
import { useOffer as useDuo } from '../operations/springSale2026Duo/useOffer';
import { configuration as family } from '../operations/springSale2026Family/configuration';
import { useOffer as useFamily } from '../operations/springSale2026Family/useOffer';
import { configuration as mailPlus } from '../operations/springSale2026MailPlus/configuration';
import { useOffer as useMailPlus } from '../operations/springSale2026MailPlus/useOffer';
import { configuration as mailPlusRetention } from '../operations/springSale2026MailPlusRetention/configuration';
import { useOffer as useMailPlusRetention } from '../operations/springSale2026MailPlusRetention/useOffer';
import { configuration as mailPlusToYearly } from '../operations/springSale2026MailPlusToYearly/configuration';
import { useOffer as useMailPlusToYearly } from '../operations/springSale2026MailPlusToYearly/useOffer';
import { configuration as passPlus } from '../operations/springSale2026PassPlus/configuration';
import { useOffer as usePassPlus } from '../operations/springSale2026PassPlus/useOffer';
import { configuration as passPlusRetention } from '../operations/springSale2026PassPlusRetention/configuration';
import { useOffer as usePassPlusRetention } from '../operations/springSale2026PassPlusRetention/useOffer';
import { configuration as unlimitedFromDrivePlus } from '../operations/springSale2026UnlimitedFromDrivePlus/configuration';
import { useOffer as useUnlimitedFromDrivePlus } from '../operations/springSale2026UnlimitedFromDrivePlus/useOffer';
import { configuration as unlimitedFromMailPlus } from '../operations/springSale2026UnlimitedFromMailPlus/configuration';
import { useOffer as useUnlimitedFromMailPlus } from '../operations/springSale2026UnlimitedFromMailPlus/useOffer';
import { configuration as unlimitedFromPassPlus } from '../operations/springSale2026UnlimitedFromPassPlus/configuration';
import { useOffer as useUnlimitedFromPassPlus } from '../operations/springSale2026UnlimitedFromPassPlus/useOffer';
import { configuration as unlimitedFromVpnPlus } from '../operations/springSale2026UnlimitedFromVpnPlus/configuration';
import { useOffer as useUnlimitedFromVpnPlus } from '../operations/springSale2026UnlimitedFromVpnPlus/useOffer';
import { configuration as unlimitedRetention } from '../operations/springSale2026UnlimitedRetention/configuration';
import { useOffer as useUnlimitedRetention } from '../operations/springSale2026UnlimitedRetention/useOffer';
import { configuration as vpnPlus } from '../operations/springSale2026VpnPlus/configuration';
import { useOffer as useVpnPlus } from '../operations/springSale2026VpnPlus/useOffer';
import { configuration as vpnPlusRetention } from '../operations/springSale2026VpnPlusRetention/configuration';
import { useOffer as useVpnPlusRetention } from '../operations/springSale2026VpnPlusRetention/useOffer';
import { configuration as vpnPlusToYearly } from '../operations/springSale2026VpnPlusToYearly/configuration';
import { useOffer as useVpnPlusToYearly } from '../operations/springSale2026VpnPlusToYearly/useOffer';
import type { SpringSale2026OfferId } from './springSale2026offers';

export const springSale2026Configs: Record<SpringSale2026OfferId, OfferConfig> = {
    'spring-sale-2026-vpn-plus': vpnPlus,
    'spring-sale-2026-vpn-plus-to-yearly': vpnPlusToYearly,
    'spring-sale-2026-vpn-plus-retention': vpnPlusRetention,

    'spring-sale-2026-mail-plus': mailPlus,
    'spring-sale-2026-mail-plus-to-yearly': mailPlusToYearly,
    'spring-sale-2026-mail-plus-retention': mailPlusRetention,

    'spring-sale-2026-drive-plus': drivePlus,
    'spring-sale-2026-drive-plus-retention': drivePlusRetention,

    'spring-sale-2026-pass-plus': passPlus,
    'spring-sale-2026-pass-plus-retention': passPlusRetention,

    'spring-sale-2026-unlimited-from-vpn-plus': unlimitedFromVpnPlus,
    'spring-sale-2026-unlimited-from-mail-plus': unlimitedFromMailPlus,
    'spring-sale-2026-unlimited-from-drive-plus': unlimitedFromDrivePlus,
    'spring-sale-2026-unlimited-from-pass-plus': unlimitedFromPassPlus,
    'spring-sale-2026-unlimited-retention': unlimitedRetention,

    'spring-sale-2026-duo': duo,
    'spring-sale-2026-family': family,
};

export function useSpringSale2026(): Operation[] {
    const vpnPlus = useVpnPlus();
    const vpnPlusToYearly = useVpnPlusToYearly();
    const vpnPlusRetention = useVpnPlusRetention();

    const mailPlus = useMailPlus();
    const mailPlusToYearly = useMailPlusToYearly();
    const mailPlusRetention = useMailPlusRetention();

    const drivePlus = useDrivePlus();
    const drivePlusRetention = useDrivePlusRetention();

    const passPlus = usePassPlus();
    const passPlusRetention = usePassPlusRetention();

    const unlimitedFromVpnPlus = useUnlimitedFromVpnPlus();
    const unlimitedFromMailPlus = useUnlimitedFromMailPlus();
    const unlimitedFromDrivePlus = useUnlimitedFromDrivePlus();
    const unlimitedFromPassPlus = useUnlimitedFromPassPlus();
    const unlimitedRetention = useUnlimitedRetention();

    const duo = useDuo();
    const family = useFamily();

    return [
        vpnPlus,
        vpnPlusToYearly,
        vpnPlusRetention,

        mailPlus,
        mailPlusToYearly,
        mailPlusRetention,

        drivePlus,
        drivePlusRetention,

        passPlus,
        passPlusRetention,

        unlimitedFromVpnPlus,
        unlimitedFromMailPlus,
        unlimitedFromDrivePlus,
        unlimitedFromPassPlus,
        unlimitedRetention,

        duo,
        family,
    ];
}
