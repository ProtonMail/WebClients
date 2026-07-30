import { cancellationFlow } from './cancellation-flow';
import type { CouponConfig } from './interface';
import { monthlyNudgeConfig } from './monthlyNudge';
import { tryMailPlus0724Config } from './tryMailPlus0724';
import { tryMailPlusMobile2026Config } from './tryMailPlusMobile2026';
import { vpn15mConfig } from './vpn15m';

export const defaultCouponConfigs: CouponConfig[] = [
    monthlyNudgeConfig,
    vpn15mConfig,
    cancellationFlow,
    tryMailPlus0724Config,
    tryMailPlusMobile2026Config,
];
