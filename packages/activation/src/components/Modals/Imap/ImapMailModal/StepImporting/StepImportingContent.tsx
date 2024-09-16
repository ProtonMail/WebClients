import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
import importStartedSvg from '@proton/styles/assets/img/onboarding/import-assistant.svg';

interface Props {
    importedEmailAddress: string;
    isCurrentLocationImportPage: boolean;
    onClose: () => void;
    toEmail: string;
}

const StepImportingContent = ({
    importedEmailAddress: fromEmail,
    toEmail,
    onClose,
    isCurrentLocationImportPage,
}: Props) => {
    const importProgressLink = (
        <SettingsLink key="link" path="/easy-switch" onClick={() => onClose()}>{c('Info').t`here`}</SettingsLink>
    );

    return (
        <div className="text-center mb-8">
            <img src={importStartedSvg} alt="" className="max-w-4/5" />
            <h3>{c('Info').t`Import in progress`}</h3>
            <div className="mb-4">{c('Info').t`Importing your data from ${fromEmail} to ${toEmail}.`}</div>
            <div>{c('Info').t`We'll notify you when the import is done.`}</div>
            <div className="mb-4">{c('Info').t`Large imports can take several days.`}</div>

            {!isCurrentLocationImportPage && (
                <div className="mb-4">{c('Info').jt`You can check the progress ${importProgressLink}.`}</div>
            )}

            <div>{c('Info').t`Close this screen to exit.`}</div>
        </div>
    );
};

export default StepImportingContent;
