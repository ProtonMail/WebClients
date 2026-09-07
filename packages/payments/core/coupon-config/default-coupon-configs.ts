import { cancellationFlowMetadata } from './configs/cancellation-flow';
import { monthlyNudgeMetadata } from './configs/monthly-nudge';
import { porkbunMetadata } from './configs/porkbun';
import { q3Sale2026Metadata } from './configs/q3-sale-2026';
import { tryMailPlus0724Metadata } from './configs/try-mail-plus-0724';
import { tryMailPlus0926Metadata } from './configs/try-mail-plus-0926';
import { tryMailPlusMobile2026Metadata } from './configs/try-mail-plus-mobile-2026';
import { vpn15mMetadata } from './configs/vpn15m';
import type { CouponConfigMetadata } from './interface';

export const defaultCouponConfigMetadata: CouponConfigMetadata[] = [
    monthlyNudgeMetadata,
    vpn15mMetadata,
    q3Sale2026Metadata,
    cancellationFlowMetadata,
    tryMailPlus0724Metadata,
    tryMailPlus0926Metadata,
    tryMailPlusMobile2026Metadata,
    porkbunMetadata,
];
