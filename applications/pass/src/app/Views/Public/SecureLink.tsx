import type { FC } from 'react';
import { Suspense, lazy } from 'react';

import { c } from 'ttag';

import { Loader } from '@proton/components';
import { UpsellFloatingModal } from '@proton/pass/components/Upsell/UpsellFloatingModal';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { PublicLayout } from './PublicLayout';

const SecureLinkView = lazy(
    () => import(/* webpackChunkName: "SecureLinkView" */ '@proton/pass/components/SecureLink/SecureLinkView')
);

export const SecureLink: FC = () => (
    <PublicLayout>
        <Suspense fallback={<Loader />}>
            <SecureLinkView />
        </Suspense>
        <UpsellFloatingModal
            className="hidden sm:block"
            badgeText={c('Label').t`Free forever`}
            title={c('Label').t`Open-source password manager for effortless protection.`}
            subtitle={c('Label')
                .t`Securely store, share and auto-login your accounts with ${PASS_APP_NAME}, using end-to-end encryption trusted by millions.`}
        />
    </PublicLayout>
);
