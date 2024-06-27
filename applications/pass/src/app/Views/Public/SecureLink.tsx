import type { FC } from 'react';
import { Suspense, lazy } from 'react';

import { Loader } from '@proton/components/components';

import { PublicLayout } from './PublicLayout';

const SecureLinkView = lazy(
    () => import(/* webpackChunkName: "SecureLinkView" */ '@proton/pass/components/SecureLink/SecureLinkView')
);

export const SecureLink: FC = () => (
    <PublicLayout>
        <Suspense fallback={<Loader />}>
            <SecureLinkView />
        </Suspense>
    </PublicLayout>
);
