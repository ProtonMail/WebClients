import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { getSAMLEdugainInfo, setupEdugainSAML } from '@proton/shared/lib/api/samlSSO';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces';
import { EdugainAffiliations } from '@proton/shared/lib/interfaces';

import { EdugainAffiliationLabels } from './SsoPage';

enum STEP {
    ORGANIZATION,
    AFFILIATIONS,
}

interface Props extends ModalProps {
    domain: Domain;
    SSOEntityID?: string;
    ExistingEdugainAffiliations?: EdugainAffiliations[];
    onClose: () => void;
}

interface EduGainOrganization {
    EntityId: string;
    Name: string;
}

const EduGainLoader = () => (
    <div className="flex flex-column items-center gap-3 p-6">
        <Loader size="medium" className="color-primary" />
        <p className="color-weak m-0">{c('Info').t`Loading eduGAIN data...`}</p>
    </div>
);

const ConfigureSamlEdugainModal = ({ domain, onClose, SSOEntityID, ExistingEdugainAffiliations, ...rest }: Props) => {
    const [step, setStep] = useState(STEP.ORGANIZATION);

    const { createNotification } = useNotifications();

    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const { onFormSubmit } = useFormErrors();

    const [loading, withLoading] = useLoading();

    const [organizationData, setOrganizationData] = useState<EduGainOrganization[]>([]);
    const [organizationValue, setOrganizationValue] = useState<EduGainOrganization | null>(null);

    const getEdugainInfo = async () => {
        try {
            const response = await api(getSAMLEdugainInfo());
            const organizations: EduGainOrganization[] = response.Information[0].Organizations;
            setOrganizationData(organizations);
            const matchingOrganization = organizations.find((org) => org.EntityId === SSOEntityID);

            if (matchingOrganization) {
                setOrganizationValue(matchingOrganization);
            } else if (organizations.length > 0) {
                setOrganizationValue(organizations[0]);
            }
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        void withLoading(getEdugainInfo());
    }, []);

    const [affiliationsValue, setAffiliationsValue] = useState(ExistingEdugainAffiliations ?? []);

    const affiliationsText = useMemo(() => {
        if (affiliationsValue.length === 0 || affiliationsValue.length === Object.keys(EdugainAffiliations).length) {
            return c('Info').t`All users`;
        } else {
            return affiliationsValue
                .map((option) => EdugainAffiliationLabels[option as EdugainAffiliations])
                .join(', ');
        }
    }, [affiliationsValue]);

    const getOrganizationText = () => {
        switch (organizationData.length) {
            case 0:
                return getBoldFormattedText(
                    c('Info').t`No organizations enabled with **eduGAIN** for **${domain.DomainName}**.`
                );

            case 1:
                return getBoldFormattedText(
                    c('Info').t`This organization is enabled with **eduGAIN** for **${domain.DomainName}**.`
                );

            default:
                return getBoldFormattedText(
                    c('Info').t`Select an organization enabled with **eduGAIN** for **${domain.DomainName}**.`
                );
        }
    };

    const {
        title,
        content,
        footer,
        onSubmit,
    }: { title: string; content: ReactNode; footer: ReactNode; onSubmit?: () => void } = (() => {
        if (step === STEP.ORGANIZATION) {
            return {
                onSubmit: () => setStep(STEP.AFFILIATIONS),
                title: c('Title').t`Connect organization`,
                content: loading ? (
                    <EduGainLoader />
                ) : (
                    <div>
                        <div className="mb-4">{getOrganizationText()}</div>
                        {organizationData.length > 0 && (
                            <div>
                                {organizationData.length === 1 ? (
                                    <div className="rounded border bg-weak px-3 py-2">
                                        <span className="block">{organizationData[0].Name}</span>
                                        <span className="block color-weak">{organizationData[0].EntityId}</span>
                                    </div>
                                ) : (
                                    <SelectTwo
                                        value={organizationValue}
                                        onValue={setOrganizationValue}
                                        className="h-auto"
                                    >
                                        {organizationData.map((item) => (
                                            <Option key={item.EntityId} title={item.Name} value={item}>
                                                <span className="block">{item.Name}</span>
                                                <span className="block color-weak">{item.EntityId}</span>
                                            </Option>
                                        ))}
                                    </SelectTwo>
                                )}
                            </div>
                        )}
                        {organizationValue && (
                            <p className="mb-0 mt-4">
                                {getBoldFormattedText(
                                    c('Info')
                                        .t`Continue to connect **${organizationValue.Name}** with your ${BRAND_NAME} organization.`
                                )}
                            </p>
                        )}
                    </div>
                ),
                footer: (
                    <>
                        <div />
                        <Button type="submit" disabled={!organizationValue} color="norm">
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.AFFILIATIONS) {
            const handleSubmit = async () => {
                if (!onFormSubmit()) {
                    return;
                }

                const affiliations =
                    affiliationsValue.length === 0 ? Object.values(EdugainAffiliations) : affiliationsValue;

                try {
                    if (!organizationValue) {
                        throw new Error('No organization selected. Please select an organization before proceeding.');
                    }

                    await api(
                        setupEdugainSAML({
                            DomainID: domain.ID,
                            EdugainAffiliations: affiliations,
                            SSOEntityID: organizationValue.EntityId,
                        })
                    );
                } catch (error) {
                    throw error;
                }

                await call();
                createNotification({ text: c('Info').t`EduGain configuration saved` });
                onClose();
            };

            return {
                title: c('Title').t`Choose user affiliations`,
                onSubmit: () => withSubmitting(handleSubmit),
                content: organizationValue && (
                    <div>
                        <div className="mb-4">
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Select the user affiliations from **${organizationValue.Name}** (${organizationValue.EntityId}) that you want to allow into your ${BRAND_NAME} organization:`
                            )}
                        </div>
                        <div>
                            <SelectTwo
                                value={affiliationsValue}
                                onValue={setAffiliationsValue}
                                multiple
                                placeholder={c('Title').t`Choose user affiliations`}
                            >
                                {Object.values(EdugainAffiliations).map((userType) => (
                                    <Option
                                        title={EdugainAffiliationLabels[userType as EdugainAffiliations]}
                                        value={userType}
                                        key={userType}
                                    />
                                ))}
                            </SelectTwo>
                            <p className="m-0 mt-1 text-sm color-hint">{c('Info')
                                .t`Select one or multiple user affiliations`}</p>
                        </div>
                        <p className="mb-0 mt-4">
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Continue to allow **${affiliationsText}** from **${organizationValue.Name}** to join your ${BRAND_NAME} organization.`
                            )}
                        </p>
                    </div>
                ),
                footer: (
                    <>
                        <Button onClick={() => setStep(STEP.ORGANIZATION)}>{c('Action').t`Back`}</Button>
                        <Button type="submit" loading={submitting} color="norm">
                            {c('Action').t`Done`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error('No step found');
    })();

    return (
        <Modal as={Form} onSubmit={onSubmit} size="large" onClose={onClose} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default ConfigureSamlEdugainModal;
