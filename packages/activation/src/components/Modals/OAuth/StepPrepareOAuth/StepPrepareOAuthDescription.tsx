import { c } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const StepPrepareDescription = () => {
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);

    const importedEmailAddressStrong = <strong key={importerData?.importedEmail}>{importerData?.importedEmail}</strong>;

    return (
        <>
            <div className="mb-4">
                {c('Info')
                    .jt`Your data is ready to import from ${importedEmailAddressStrong} to your ${BRAND_NAME} account.`}
            </div>
            <div>{c('Info').t`Just confirm your selection and we'll do the rest.`}</div>
        </>
    );
};

export default StepPrepareDescription;
