import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { OpenExtension } from '@proton/pass/components/Onboarding/UI/OpenExtension';
import { Sample } from '@proton/pass/components/Onboarding/UI/Sample';
import { PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import { selectImportReport } from '@proton/pass/store/selectors/import';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Header } from './Header';

const getReportHeader = (imported: number, ignored: number) => {
    if (ignored === 0) {
        return {
            title: c('Title').t`Import successful`,
            subtitle: c('Title').t`You are ready to get the most out of ${PASS_APP_NAME}.`,
        };
    }

    if (imported === 0) {
        return {
            title: c('Title').t`Import failed`,
            subtitle: c('Title').t`None of your items could be imported. See the details below.`,
        };
    }

    return {
        title: c('Title').t`Import completed with warnings`,
        subtitle: c('Title').t`Some of your items could not be imported. See the details below.`,
    };
};

export const ImportReport = () => {
    const report = useSelector(selectImportReport);

    // No reports, go back
    if (!report) return <Redirect to="/import" />;

    const provider = PROVIDER_INFO_MAP[report.provider];
    const imported = report.total;
    const total = imported + report.ignored.length;
    const percentage = total > 0 ? Math.floor((imported * 100) / total) : 100;
    const totalIgnored = report.ignored.length;

    const handleClose = () => window.close();

    return (
        <Layout>
            <OpenExtension />
            <div className="flex flex-column items-center lg:w-2/3 pass-onboarding-open-extension-margin">
                <Header {...getReportHeader(imported, totalIgnored)} />
                {report.sampleItem && (
                    <Sample
                        service={report.sampleItem.name}
                        userIdentifier={report.sampleItem.userIdentifier}
                        url={report.sampleItem.url}
                    />
                )}
                <hr className="w-full my-8" />
                <div className="flex flex-column justify-start min-w-1/2">
                    <p className="text-lg m-2">
                        <strong className="color-weak text-normal">{c('Title').t`Imported from:`}</strong>
                        <span className="text-semibold ml-2">{provider.title}</span>
                    </p>
                    <p className="text-lg m-2">
                        <strong className="color-weak text-normal">{c('Title').t`Imported items:`}</strong>
                        <span className="text-semibold ml-2">
                            {
                                // translator: imported items count out of the total, eg: "42 of 50 (84%)"
                                c('Info').t`${imported} of ${total} (${percentage}%)`
                            }
                        </span>
                    </p>
                    {totalIgnored > 0 && (
                        <Banner variant="danger" className="text-lg mt-8">
                            <p className="text-semibold">
                                {c('Info').ngettext(
                                    msgid`The following ${totalIgnored} item could not be imported:`,
                                    `The following ${totalIgnored} items could not be imported:`,
                                    totalIgnored
                                )}
                            </p>
                            {report.ignored.map((ignored, idx) => (
                                <p key={`ignored-${idx}`}>{ignored}</p>
                            ))}
                        </Banner>
                    )}
                </div>
                <h4 className="h3 text-semibold mt-12">{c('Title')
                    .t`For security purposes, delete your exported file.`}</h4>
                <OnboardingButton color="norm" fullWidth size="large" className="w-1/2 mt-8" onClick={handleClose}>
                    {c('Action').t`Close`}
                </OnboardingButton>
            </div>
        </Layout>
    );
};
