import type { FC } from 'react';

import { c } from 'ttag';

import { ImportIcon } from '@proton/pass/components/Import/ImportIcon';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import type { ImportProvider, ImportProviderInfo } from '@proton/pass/lib/import/types';
import { ImportProviderBrowsers, ImportProviderPasswordManagers } from '@proton/pass/lib/import/types';

import { Header } from './Header';

const Provider: FC<{ provider: { key: ImportProvider } & ImportProviderInfo }> = ({ provider }) => {
    return (
        <a
            className="pass-onboarding-card flex flex-column py-4 items-center rounded-xl gap-2"
            href={`#/import/${provider.key}`}
        >
            <ImportIcon provider={provider.key} className="w-custom" style={{ '--w-custom': '2.5rem' }} />
            <span className="text-lg text-semibold">{provider.title}</span>
            <span className="text-lg color-weak">{provider.fileExtension}</span>
        </a>
    );
};

export const ImportProviders = () => {
    return (
        <Layout>
            <div className="flex flex-column items-center lg:w-2/3">
                <Header
                    title={c('Title').t`Import your passwords in less than a minute`}
                    subtitle={c('Title')
                        .t`We'll guide you through the process. First choose where you currently store your passwords.`}
                    stepper={{ step: 'providers' }}
                />
                <h4 className="mt-8 h3 self-start">{c('Title').t`Browsers`}</h4>
                <div className="grid grid-cols-4 gap-4 mt-4 w-full">
                    {ImportProviderBrowsers.map((provider) => (
                        <Provider key={provider.key} provider={provider} />
                    ))}
                </div>
                <h4 className="mt-8 h3 self-start">{c('Title').t`Password managers`}</h4>
                <div className="grid grid-cols-4 gap-4 mt-4 w-full">
                    {ImportProviderPasswordManagers.map((provider) => (
                        <Provider key={provider.key} provider={provider} />
                    ))}
                </div>
            </div>
        </Layout>
    );
};
