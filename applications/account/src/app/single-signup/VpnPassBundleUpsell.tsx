import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PassLogo, SkeletonLoader } from '@proton/components';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import Box from './Box';

interface VpnPassBundleUpsellProps {
    padding: string;
    isVpnPassBundle: boolean;
    isLoadingModelDeps: boolean;
    bundlePlanPriceInline: ReactElement;
    onToggle: (isVpnPassBundle: boolean) => void;
}

export const VpnPassBundleUpsell = ({
    padding,
    isVpnPassBundle,
    bundlePlanPriceInline,
    onToggle,
    isLoadingModelDeps,
}: VpnPassBundleUpsellProps) => {
    return (
        <Box className={clsx('mt-8 p-4 w-full border border-primary border-2', padding)}>
            <div className={clsx('pricing-box-content', 'mt-0')}>
                {isLoadingModelDeps ? (
                    <SkeletonLoader height="2.5rem" width="30rem" />
                ) : (
                    <div className="flex sm:flex-row flex-column gap-4 w-full justify-space-between items-center">
                        <div className="flex flex-row gap-4 items-center sm:flex-1">
                            <div className="border p-1 rounded-lg" title={PLAN_NAMES[PLANS.PASS]}>
                                <PassLogo variant="glyph-only" size={8} />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-column gap-1">
                                    <div className="flex flex-row gap-2 items-center">
                                        <strong className="text-lg">{c('Info')
                                            .jt`Add ${BRAND_NAME} ${PASS_SHORT_APP_NAME} for just ${bundlePlanPriceInline}`}</strong>
                                    </div>
                                    <span className="block color-weak">
                                        {c('Info')
                                            .jt`Keep your passwords safe and sign in instantly with autofill across every device.`}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            color={isVpnPassBundle ? 'danger' : 'norm'}
                            shape={isVpnPassBundle ? 'outline' : undefined}
                            className="button-solid-norm button-large"
                            onClick={() => onToggle(isVpnPassBundle)}
                        >
                            <span data-testid="pass-bundle-box-add-button">
                                {isVpnPassBundle
                                    ? c('Action').t`Remove`
                                    : c('Action').t`Add ${BRAND_NAME} ${PASS_SHORT_APP_NAME}`}
                            </span>
                        </Button>
                    </div>
                )}
            </div>
        </Box>
    );
};
