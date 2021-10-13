import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import importStartedSvg from '@proton/styles/assets/img/onboarding/import-assistant.svg';

import { SettingsLink } from '../../../components';

import { IA_PATHNAME_REGEX } from '../constants';

interface Props {
    importedEmailAddress: string;
    toEmail: string;
    onClose: () => void;
}

const ImportStartedStep = ({ importedEmailAddress, toEmail, onClose }: Props) => {
    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);

    const importProgressLink = (
        <SettingsLink key="link" path="/easy-switch" onClick={() => onClose()}>{c('Info').t`here`}</SettingsLink>
    );

    return (
        <div className="text-center mb2">
            <img src={importStartedSvg} alt="" className="max-w80" />
            <h3>{c('Info').t`Import in progress`}</h3>
            <div className="mb1">{c('Info').t`Importing your data from ${importedEmailAddress} to ${toEmail}.`}</div>
            <div>{c('Info').t`We'll notify you when the import is done.`}</div>
            <div className="mb1">{c('Info').t`Large imports can take several days.`}</div>

            {!isCurrentLocationImportPage && (
                <div className="mb1">{c('Info').jt`You can check the progress ${importProgressLink}.`}</div>
            )}

            <div>{c('Info').t`Close this screen to exit.`}</div>
        </div>
    );
};

export default ImportStartedStep;
