import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useModalState } from '@proton/components/components/modalTwo';
import { Tooltip } from '@proton/components/components/tooltip';
import useDomains from '@proton/components/hooks/useDomains';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSectionWide } from '../../account';
import CreateUserAccountsModal from './CreateUserAccountsModal/CreateUserAccountsModal';
import UploadCSVFileButton from './UploadCSVFileButton';
import { downloadSampleCSV } from './csv';
import { UserTemplate } from './types';

const MultiUserCreationSection = ({ app }: { app: APP_NAMES }) => {
    const [domains = []] = useDomains();
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();

    const onCSVFileUpload = (usersToImport: UserTemplate[]) => {
        setUsersToImport(usersToImport);
        setCreateUserAccountsModal(true);
    };

    return (
        <>
            {renderCreateUserAccountsModal && usersToImport && (
                <CreateUserAccountsModal usersToImport={usersToImport} app={app} {...createUserAccountsModal} />
            )}
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`Add multiple users to your organization at once.`}</SettingsParagraph>
                <SettingsParagraph className="mb-4">
                    {c('Info')
                        .t`Download our CSV template, fill in the user details, and then upload your completed CSV file to create accounts for these users.`}
                </SettingsParagraph>

                <div className="flex flex-rows flex-gap-1">
                    {domains.length === 0 ? (
                        <Tooltip
                            title={c('familyOffer_2023:Family plan')
                                .t`You need to configure a custom domain before adding multiple users.`}
                        >
                            <span>
                                <Button disabled>{c('Select file').t`Upload CSV file`}</Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" />
                    )}
                    <Button onClick={downloadSampleCSV}>{c('Action').t`Download CSV sample`}</Button>
                </div>
            </SettingsSectionWide>
        </>
    );
};

export default MultiUserCreationSection;
