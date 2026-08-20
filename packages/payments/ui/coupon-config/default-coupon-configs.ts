import { cancellationFlow } from './cancellation-flow';
import type { CouponConfig } from './interface';
import { monthlyNudgeConfig } from './monthlyNudge';
import { q3Sale2026Config } from './q3Sale2026';
import { tryMailPlus0724Config } from './tryMailPlus0724';
import { tryMailPlusMobile2026Config } from './tryMailPlusMobile2026';
import { vpn15mConfig } from './vpn15m';

export const defaultCouponConfigs: CouponConfig[] = [
    monthlyNudgeConfig,
    vpn15mConfig,
    q3Sale2026Config,
    cancellationFlow,
    tryMailPlus0724Config,
    tryMailPlusMobile2026Config,
];
