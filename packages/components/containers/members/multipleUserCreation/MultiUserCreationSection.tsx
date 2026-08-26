import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import useModalState from '../../../components/modalTwo/useModalState';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import CreateUserAccountsModal from './CreateUserAccountsModal/CreateUserAccountsModal';
import DownloadCsvSampleButton from './DownloadCsvSampleButton';
import UploadCSVFileButton from './UploadCSVFileButton';
import type { CsvConfig } from './csv';
import type { UserTemplate } from './types';

const defaultCsvConfig: CsvConfig = {
    multipleAddresses: true,
    includeStorage: true,
    includeVpnAccess: true,
    includePrivateSubUser: true,
    mode: CreateMemberMode.Invitation,
};

const MultiUserCreationSection = ({ app }: { app: APP_NAMES }) => {
    const [customDomains = []] = useCustomDomains();
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [members] = useMembers();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();
    const [detectedMode, setDetectedMode] = useState(defaultCsvConfig.mode);

    const verifiedDomains = useMemo(() => (customDomains || []).filter(getIsDomainActive), [customDomains]);

    const onCSVFileUpload = (usersToImport: UserTemplate[], detectedMode: CreateMemberMode) => {
        setUsersToImport(usersToImport);
        setDetectedMode(detectedMode);
        setCreateUserAccountsModal(true);
    };

    return (
        <>
            {renderCreateUserAccountsModal && usersToImport && (
                <CreateUserAccountsModal
                    mode={detectedMode}
                    members={members}
                    usersToImport={usersToImport}
                    app={app}
                    verifiedDomains={verifiedDomains}
                    {...createUserAccountsModal}
                    expectedCsvConfig={{ ...defaultCsvConfig, mode: detectedMode }}
                />
            )}
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`Add multiple users to your organization at once.`}</SettingsParagraph>
                <SettingsParagraph className="mb-4">
                    {c('Info')
                        .t`Download our CSV template, fill in the user details, and then upload your completed CSV file to create accounts for these users.`}
                </SettingsParagraph>

                <div className="flex flex-rows gap-4">
                    {verifiedDomains.length === 0 ? (
                        <Tooltip
                            title={c('familyOffer_2023:Family plan')
                                .t`You need to configure a custom domain before adding multiple users.`}
                        >
                            <span>
                                <Button disabled>{c('Select file').t`Upload CSV file`}</Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" csvConfig={defaultCsvConfig} />
                    )}
                    <DownloadCsvSampleButton csvConfig={defaultCsvConfig} />
                </div>
            </SettingsSectionWide>
        </>
    );
};

export default MultiUserCreationSection;
