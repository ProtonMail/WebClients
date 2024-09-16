import type { MutableRefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import {
    OrganizationKeyMode,
    OrganizationKeyState,
    getOrganizationKeyInfo,
} from '@proton/shared/lib/organization/helper';

import { Loader, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useAddresses, useOrganizationKey } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import useDisplayOrganizationKey from './useDisplayOrganizationKey';
import useOrganizationModals from './useOrganizationModals';

interface Props {
    organization?: Organization;
    onceRef: MutableRefObject<boolean>;
}

const OrganizationPasswordSection = ({ organization, onceRef }: Props) => {
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey();
    const [addresses] = useAddresses();
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey, addresses);
    const displayOrganizationKey = useDisplayOrganizationKey(organizationKey);
    const { modals, info, handleChangeOrganizationPassword, handleChangeOrganizationKeys } =
        useOrganizationModals(onceRef);

    const tableHeaders = [c('Header').t`Organization key fingerprint`, c('Header').t`Key type`];

    const loading = !organization || loadingOrganizationKey;

    return (
        <>
            {modals}
            {(() => {
                if (loading) {
                    return <Loader />;
                }

                // Organization is not setup.
                if (!organization?.HasKeys) {
                    return (
                        <Alert className="mb-4" type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>
                    );
                }

                return (
                    <SettingsSection>
                        <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/organization-key')}>
                            {c('Info')
                                .t`Your organization's emails are protected with end-to-end encryption using the organization key. This fingerprint can be used to verify that all administrators in your account have the same key.`}
                        </SettingsParagraph>
                        <div className="mb-4">
                            {organizationKeyInfo.state === OrganizationKeyState.Active && (
                                <>
                                    {organizationKeyInfo.mode !== OrganizationKeyMode.Passwordless && (
                                        <Button
                                            color="norm"
                                            onClick={handleChangeOrganizationPassword}
                                            className="mr-4 mb-2"
                                        >
                                            {c('Action').t`Change password`}
                                        </Button>
                                    )}
                                    <Button className="mb-2" onClick={() => handleChangeOrganizationKeys()}>
                                        {c('passwordless').t`Change organization key`}
                                    </Button>
                                </>
                            )}
                            {info}
                        </div>
                        {displayOrganizationKey.fingerprint && (
                            <Table responsive="cards">
                                <TableHeader cells={tableHeaders} />
                                <TableBody colSpan={2}>
                                    <TableRow
                                        labels={tableHeaders}
                                        cells={[
                                            <code key={1} className="max-w-full block text-ellipsis">
                                                {displayOrganizationKey.fingerprint}
                                            </code>,
                                            displayOrganizationKey.algorithm,
                                        ]}
                                    />
                                </TableBody>
                            </Table>
                        )}
                    </SettingsSection>
                );
            })()}
        </>
    );
};

export default OrganizationPasswordSection;
