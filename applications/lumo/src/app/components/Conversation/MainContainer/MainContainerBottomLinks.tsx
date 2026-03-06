import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import LumoB2BUpsellLink from '../../../upsells/components/B2BUpsellLink';

export const MainContainerBottomLinks = ({ className }: { className?: string }) => {
    const { showForBusinessLink } = useLumoPlan();

    return (
        <ul className={clsx('unstyled flex flex-row items-center m-0 gap-2', className)}>
            <li className="pt-1 no-print">
                <Href href="/about" className="inline-flex py-3 px-4 color-weak text-no-decoration">{c(
                    'collider_2025: Top nav link'
                ).t`About`}</Href>
            </li>
            <li className="pt-1 no-print">
                <Href href="https://proton.me" className="inline-flex py-3 px-4 color-weak text-no-decoration">{c(
                    'collider_2025: b2b'
                ).t`By ${BRAND_NAME}`}</Href>
            </li>
            {showForBusinessLink && (
                <li className="pt-1 no-print">
                    <LumoB2BUpsellLink className="inline-flex py-3 px-4 color-weak text-no-decoration flex flex-row items-center gap-1" />
                </li>
            )}
        </ul>
    );
};
