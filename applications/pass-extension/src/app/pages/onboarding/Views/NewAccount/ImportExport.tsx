import { Redirect, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { Tutorial } from '@proton/pass/components/Onboarding/UI/Tutorial';
import { getTutorial } from '@proton/pass/lib/import/tutorials';
import type { ImportProvider, ImportProviderInfo } from '@proton/pass/lib/import/types';
import { PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import type { Maybe } from '@proton/pass/types/utils';

import { Header } from './Header';

export const ImportExport = () => {
    const { provider: providerKeyRaw } = useParams<{ provider: string }>();
    const providerKey = providerKeyRaw as ImportProvider;
    const provider: Maybe<ImportProviderInfo> = PROVIDER_INFO_MAP[providerKey];

    // Provider doesn't exist, go back
    if (!providerKey || !provider) return <Redirect to="/import" />;

    return (
        <Layout contentLayout="fill">
            <div className="flex flex-column flex-nowrap flex-1 min-h-0 w-full lg:w-2/3 items-center self-center">
                <div className="shrink-0 flex flex-column items-center w-full p-4">
                    <Header
                        title={c('Title').t`Export from ${provider.title}`}
                        subtitle={c('Title').t`Important: Once your data has been imported, delete the exported file.`}
                        stepper={{ step: 'export', provider: providerKey }}
                    />
                </div>

                <div className="flex-1 min-h-0 w-full overflow-auto flex justify-center p-4">
                    <div className="w-full xl:w-2/3">
                        <Tutorial className="p-4">{getTutorial(providerKey)}</Tutorial>
                    </div>
                </div>

                <div className="shrink-0 p-4 w-full flex flex-row justify-center items-center gap-4">
                    {provider.tutorialUrl && (
                        <a href={provider.tutorialUrl} target="_blank" rel="noopener noreferrer">
                            {c('Action').t`More details about how to export`}
                            <IcArrowOutSquare className="ml-1" />
                        </a>
                    )}

                    <div className="w-1/2">
                        <OnboardingButton
                            variant="outline"
                            as="a"
                            href={`#/import/${providerKey}/upload`}
                            fullWidth
                            size="large"
                            className="text-semibold"
                        >
                            {c('Action').t`Continue`}
                            <IcChevronRight />
                        </OnboardingButton>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
