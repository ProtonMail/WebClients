import { useState } from 'react';

import { c } from 'ttag';

import {
    MAX_CHARS_API,
    type OrganizationKeyRotationPayload,
    createPasswordlessOrganizationKeys,
    getKeyRotationPayload,
} from '@proton/account';
import { useMembers } from '@proton/account/members/hooks';
import { resetSelfVpnConnections, setSelfQuota, updateOrganizationName } from '@proton/account/organization/actions';
import { useOrganization } from '@proton/account/organization/hooks';
import { getInitialStorage, getStorageRange, getTotalStorage } from '@proton/account/organization/storage';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { disableStorageSelection } from '@proton/components/containers/members/helper';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useLoading } from '@proton/hooks';
import { getHasExternalMemberCapableB2BPlan, hasPassFamily } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import clamp from '@proton/utils/clamp';
import noop from '@proton/utils/noop';

import MemberStorageSelector from '../members/MemberStorageSelector';
import AdministratorList from './AdministratorList';

enum STEPS {
    NAME,
    KEY,
    STORAGE,
}

const storageSizeUnit = sizeUnits.GB;

const SetupOrganizationModal = ({ onClose, ...rest }: ModalProps) => {
    const silentApi = useSilentApi();
    const { createNotification } = useNotifications();

    const dispatch = useDispatch();
    const [members = [], loadingMembers] = useMembers();
    const [organization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState<STEPS>(STEPS.NAME);
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

    const initialStorage = getInitialStorage(organization, storageRange);
    // Storage can be undefined in the beginning because org is undefined. So we keep it floating until it's set.
    const storageValue =
        model.storage === -1 ? clamp(initialStorage, storageRange.min, storageRange.max) : model.storage;

    const finalizeOrganizationCreation = async () => {
        createNotification({ text: c('Success').t`Organization activated` });
        onClose?.();
    };

    const [keyRotationPayload, setKeyRotationPayload] = useState<null | OrganizationKeyRotationPayload>(null);
    const errorHandler = useErrorHandler();

    const handlePreStorageStep = async () => {
        // If user setting up organization for VPN B2B or Pass Family plan then the storage step must be skipped.
        // Additionally, if it is a single user org with max 1 member and all the storage assigned to the user we can skip storage
        if (hasExternalMemberCapableB2BPlan || hasPassFamily(subscription) || disableStorageSelection(organization)) {
            return finalizeOrganizationCreation();
        }
        setStep(STEPS.STORAGE);
    };

    const handleOrgKeyCreation = async () => {
        const result = await dispatch(
            getKeyRotationPayload({
                api: silentApi,
                ignorePasswordlessValidation: true,
            })
        );
        if (result.memberKeyPayloads.length) {
            setKeyRotationPayload(result);
            setStep(STEPS.KEY);
            return;
        }
        await dispatch(createPasswordlessOrganizationKeys(result));
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
                    await dispatch(resetSelfVpnConnections());
                    await dispatch(updateOrganizationName({ name: model.name }));

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
                        await dispatch(createPasswordlessOrganizationKeys(keyRotationPayload));
                        setOrgKeyCreated(true);
                    }
                    await handlePreStorageStep();
                },
            };
        }

        if (step === STEPS.STORAGE) {
            return {
                title: c('Title').t`Allocate storage`,
                section: (
                    <>
                        <div className="mb-7">
                            {c('familyOffer_2023:Info')
                                .t`Assign storage to the administrator account. You can distribute storage for additional users later on.`}
                        </div>
                        <MemberStorageSelector
                            orgInitialization
                            value={storageValue}
                            sizeUnit={storageSizeUnit}
                            totalStorage={getTotalStorage(selfMember, organization)}
                            range={storageRange}
                            onChange={handleChange('storage')}
                            validator={validator}
                        />
                    </>
                ),
                async onSubmit() {
                    await dispatch(setSelfQuota(storageValue));
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
