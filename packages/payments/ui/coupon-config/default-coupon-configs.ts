import { cancellationFlow } from './cancellation-flow';
import type { CouponConfig } from './interface';
import { monthlyNudgeConfig } from './monthlyNudge';
import { summerSale2026Config } from './summerSale2026';
import { summerSale2026BundleConfig } from './summerSale2026bundle';
import { tryMailPlus0724Config } from './tryMailPlus0724';
import { vpn15mConfig } from './vpn15m';

export const defaultCouponConfigs: CouponConfig[] = [
    monthlyNudgeConfig,
    vpn15mConfig,
    summerSale2026Config,
    summerSale2026BundleConfig,
    cancellationFlow,
    tryMailPlus0724Config,
];
