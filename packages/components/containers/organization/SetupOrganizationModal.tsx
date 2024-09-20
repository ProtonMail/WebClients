import { useState } from 'react';

import { c } from 'ttag';

import type { OrganizationKeyRotationPayload } from '@proton/account';
import { MAX_CHARS_API, createPasswordlessOrganizationKeys, getKeyRotationPayload } from '@proton/account';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateQuota, updateVPN } from '@proton/shared/lib/api/members';
import { updateOrganizationName } from '@proton/shared/lib/api/organization';
import { VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import { getHasExternalMemberCapableB2BPlan } from '@proton/shared/lib/helpers/subscription';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import clamp from '@proton/utils/clamp';
import noop from '@proton/utils/noop';

import { InputFieldTwo, useFormErrors, useSettingsLink } from '../../components';
import {
    useApi,
    useErrorHandler,
    useEventManager,
    useMembers,
    useNotifications,
    useOrganization,
    useSubscription,
    useUser,
} from '../../hooks';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';
import MemberStorageSelector, {
    getInitialStorage,
    getStorageRange,
    getTotalStorage,
} from '../members/MemberStorageSelector';
import AdministratorList from './AdministratorList';

enum STEPS {
    NAME,
    KEY,
    STORAGE,
}

const storageSizeUnit = sizeUnits.GB;

const SetupOrganizationModal = ({ onClose, ...rest }: ModalProps) => {
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const goToSettings = useSettingsLink();

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const dispatch = useDispatch();
    const [members = [], loadingMembers] = useMembers();
    const [loading, withLoading] = useLoading();
    const [organization] = useOrganization();
    const [step, setStep] = useState<STEPS>(STEPS.NAME);
    const [{ hasPaidVpn }] = useUser();
    const [subscription] = useSubscription();
    const [orgKeyCreated, setOrgKeyCreated] = useState(false);
    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);
    const selfMember = members.find(({ Self }) => !!Self);
    const storageRange = getStorageRange(selfMember, organization);
    const [model, setModel] = useState({
        name: '',
        password: '',
        confirm: '',
        storage: -1,
    });
    const { validator, onFormSubmit, reset } = useFormErrors();

    const isOrgFamilyOrDuo = getOrganizationDenomination(organization) === 'familyGroup';

    const handleChange = (key: keyof typeof model) => {
        return (value: any) => setModel({ ...model, [key]: value });
    };

    const selfMemberID = selfMember?.ID;
    const initialStorage = getInitialStorage(organization, storageRange);
    // Storage can be undefined in the beginning because org is undefined. So we keep it floating until it's set.
    const storageValue =
        model.storage === -1 ? clamp(initialStorage, storageRange.min, storageRange.max) : model.storage;

    const finalizeOrganizationCreation = async () => {
        await call();
        createNotification({ text: c('Success').t`Organization activated` });
        onClose?.();
        goToSettings('/users-addresses');
    };

    const [keyRotationPayload, setKeyRotationPayload] = useState<null | OrganizationKeyRotationPayload>(null);
    const errorHandler = useErrorHandler();

    const handlePreStorageStep = async () => {
        if (hasExternalMemberCapableB2BPlan) {
            // If user setting up organization for VPN B2B plan then the storage step must be skipped.
            return finalizeOrganizationCreation();
        }
        setStep(STEPS.STORAGE);
    };

    const handleOrgKeyCreation = async () => {
        const result = await dispatch(
            getKeyRotationPayload({
                verifyOutboundPublicKeys,
                api: silentApi,
                ignorePasswordlessValidation: true,
            })
        );
        if (result.memberKeyPayloads.length) {
            setKeyRotationPayload(result);
            setStep(STEPS.KEY);
            return;
        }
        await silentApi(await dispatch(createPasswordlessOrganizationKeys(result)));
        setOrgKeyCreated(true);
        return handlePreStorageStep();
    };

    const { title, onSubmit, section } = (() => {
        if (step === STEPS.NAME) {
            const title = isOrgFamilyOrDuo
                ? c('familyOffer_2023:Title').t`Set family name`
                : c('Title').t`Set organization name`;

            const label = isOrgFamilyOrDuo
                ? c('familyOffer_2023:Label').t`Family name`
                : c('Label').t`Organization name`;

            return {
                title,
                section: (
                    <InputFieldTwo
                        id="organization-name"
                        label={label}
                        placeholder={c('Placeholder').t`Choose a name`}
                        error={validator([requiredValidator(model.name)])}
                        autoFocus
                        disableChange={loading}
                        value={model.name}
                        onValue={handleChange('name')}
                        maxLength={MAX_CHARS_API.ORG_NAME}
                    />
                ),
                async onSubmit() {
                    if (!selfMemberID) {
                        throw new Error('Missing member id');
                    }
                    // NOTE: By default the admin gets allocated all of the VPN connections. Here we artificially set the admin to the default value
                    // So that other users can get connections allocated.
                    if (hasPaidVpn) {
                        await silentApi(updateVPN(selfMemberID, VPN_CONNECTIONS));
                    }
                    await silentApi(updateOrganizationName(model.name));

                    if (organization?.RequiresKey && !orgKeyCreated) {
                        await handleOrgKeyCreation();
                    } else {
                        await handlePreStorageStep();
                    }
                },
            };
        }

        if (step === STEPS.KEY) {
            const title = c('Title').t`Create organization key`;

            return {
                title,
                section: (
                    <>
                        <div className="mb-4">
                            {c('passwordless').t`All administrators will get access to the key.`}
                        </div>

                        <AdministratorList members={keyRotationPayload?.memberKeyPayloads} expandByDefault={false} />
                    </>
                ),
                async onSubmit() {
                    if (!orgKeyCreated && keyRotationPayload) {
                        await silentApi(await dispatch(createPasswordlessOrganizationKeys(keyRotationPayload)));
                        setOrgKeyCreated(true);
                    }
                    await handlePreStorageStep();
                },
            };
        }

        if (step === STEPS.STORAGE) {
            const formattedStorage = humanSize({ bytes: storageValue });
            return {
                title: c('Title').t`Allocate storage`,
                section: (
                    <>
                        <div className="mb-7">
                            {c('familyOffer_2023:Info')
                                .t`By default we assign ${formattedStorage} of storage to the administrator account. You can manage the assigned storage to be distributed among additional users later on.`}
                        </div>
                        <MemberStorageSelector
                            orgInitialization
                            value={storageValue}
                            sizeUnit={storageSizeUnit}
                            totalStorage={getTotalStorage(selfMember, organization)}
                            range={storageRange}
                            onChange={handleChange('storage')}
                        />
                    </>
                ),
                async onSubmit() {
                    if (!selfMemberID) {
                        throw new Error('Missing member id');
                    }
                    await silentApi(updateQuota(selfMemberID, storageValue));

                    await finalizeOrganizationCreation();
                },
            };
        }

        throw new Error('Unknown step');
    })();

    const handleClose = loading ? noop : onClose;

    const handleBack = () => {
        // Going back when the organization don't requires a key should take user back to the name step
        if (!organization?.RequiresKey && step === STEPS.STORAGE) {
            setStep(STEPS.NAME);
            return;
        }

        if (step > 0) {
            setStep(step - 1);
        }
    };

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(onSubmit()).then(reset).catch(errorHandler);
            }}
            onClose={handleClose}
            size="medium"
            {...rest}
        >
            <ModalHeader title={title} />
            <ModalContent>{section}</ModalContent>
            <ModalFooter>
                {step ? (
                    <Button onClick={handleBack} disabled={loading}>
                        {c('Action').t`Back`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Close`}
                    </Button>
                )}
                <Button disabled={loadingMembers} loading={loading} type="submit" color="norm">
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SetupOrganizationModal;
