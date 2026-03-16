import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCircleRadioEmpty } from '@proton/icons/icons/IcCircleRadioEmpty';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';
import clsx from '@proton/utils/clsx';

import SecureAccountButton from './SecureAccountButton';
import { SCORE_TONE_CLASS, getRecoveryScoreTone } from './recoveryScoreState';
import useRecoveryScore, { type RecoveryScoreItemId } from './useRecoveryScore';

type RecoveryScoreModalItem = {
    id: RecoveryScoreItemId;
    label: string;
};

const getEmailNegativeCopy = (securityState: SecurityState) => {
    if (!securityState.email.value) {
        return c('Recovery score item').t`Add recovery email`;
    }

    if (!securityState.email.isEnabled) {
        return c('Recovery score item').t`Enable recovery by email`;
    }

    return c('Recovery score item').t`Verify recovery email`;
};

const getPhoneNegativeCopy = (securityState: SecurityState) => {
    if (!securityState.phone.value) {
        return c('Recovery score item').t`Add recovery phone`;
    }

    if (!securityState.phone.isEnabled) {
        return c('Recovery score item').t`Enable recovery by phone`;
    }

    return c('Recovery score item').t`Verify recovery phone`;
};

const getRecoveryScoreItemCopy = ({
    itemId,
    isEnabled,
    securityState,
}: {
    itemId: RecoveryScoreItemId;
    isEnabled: boolean;
    securityState: SecurityState;
}) => {
    if (itemId === 'email') {
        return isEnabled ? c('Recovery score item').t`Email verification enabled` : getEmailNegativeCopy(securityState);
    }

    if (itemId === 'phone') {
        return isEnabled ? c('Recovery score item').t`SMS verification enabled` : getPhoneNegativeCopy(securityState);
    }

    const copyByItemId: Record<
        Exclude<RecoveryScoreItemId, 'email' | 'phone'>,
        { positive: string; negative: string }
    > = {
        deviceRecovery: {
            positive: c('Recovery score item').t`Data recovery allowed on this device`,
            negative: c('Recovery score item').t`Allow data recovery on this device`,
        },
        recoveryFile: {
            positive: c('Recovery score item').t`Recovery file downloaded`,
            negative: c('Recovery score item').t`Download recovery file`,
        },
        recoveryContacts: {
            positive: c('Recovery score item').t`Recovery contacts added`,
            negative: c('Recovery score item').t`Add recovery contacts`,
        },
        recoveryPhrase: {
            positive: c('Recovery score item').t`Recovery phrase saved`,
            negative: c('Recovery score item').t`Save recovery phrase`,
        },
        signedInReset: {
            positive: c('Recovery score item').t`Password reset allowed from settings`,
            negative: c('Recovery score item').t`Allow password reset from settings`,
        },
        qrCodeSignIn: {
            positive: c('Recovery score item').t`Sign-in with QR code allowed`,
            negative: c('Recovery score item').t`Allow scanning QR code to sign in`,
        },
        emergencyContacts: {
            positive: c('Recovery score item').t`Emergency contacts added`,
            negative: c('Recovery score item').t`Add emergency contacts`,
        },
        passwordVerification: {
            positive: c('Recovery score item').t`Password verified`,
            negative: c('Recovery score item').t`Verify password`,
        },
    };

    const itemCopy = copyByItemId[itemId];

    return isEnabled ? itemCopy.positive : itemCopy.negative;
};

const RecoveryScoreModal = ({ onClose, ...rest }: ModalProps) => {
    const { score, maxScore, scoreItems, securityState } = useRecoveryScore();
    const availableItems = scoreItems.filter((item) => item.isAvailable);
    const checkedItems: RecoveryScoreModalItem[] = availableItems
        .filter((item) => item.isEnabled)
        .map((item) => ({
            id: item.id,
            label: getRecoveryScoreItemCopy({
                itemId: item.id,
                isEnabled: true,
                securityState,
            }),
        }));
    const uncheckedItems: RecoveryScoreModalItem[] = availableItems
        .filter((item) => !item.isEnabled)
        .map((item) => ({
            id: item.id,
            label: getRecoveryScoreItemCopy({
                itemId: item.id,
                isEnabled: false,
                securityState,
            }),
        }));
    const scoreTone = getRecoveryScoreTone(score);

    return (
        <Modal onClose={onClose} size="small" {...rest}>
            <ModalHeader
                title={c('Title').t`Your recovery setup`}
                subline={
                    <span
                        className={clsx(
                            'recovery-score-accent recovery-score-modal-pill inline-flex items-center rounded-full px-2 py-0.5 text-sm text-semibold',
                            `recovery-score-accent-${SCORE_TONE_CLASS[scoreTone]}`
                        )}
                    >
                        {c('Recovery score').t`${score} / ${maxScore} completed`}
                    </span>
                }
            />
            <ModalContent>
                {checkedItems.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-rg text-semibold mb-2">
                            {c('Recovery score').t`How you increased your account protection`}
                        </h3>
                        <ul className="unstyled m-0">
                            {checkedItems.map((item) => (
                                <li key={item.id} className="flex items-center gap-2 py-1">
                                    <IcCheckmarkCircleFilled size={4} className="shrink-0 color-success" />
                                    <span className="text-sm">{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {uncheckedItems.length > 0 && (
                    <div>
                        <h3 className="text-rg text-semibold mb-2">
                            {c('Recovery score').t`Add more options for stronger protection`}
                        </h3>
                        <ul className="unstyled m-0">
                            {uncheckedItems.map((item) => (
                                <li key={item.id} className="flex items-center gap-2 py-1">
                                    <IcCircleRadioEmpty size={4} className="shrink-0 color-hint" />
                                    <span className="text-sm">{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <SecureAccountButton fullWidth onClick={onClose} scoreTone={scoreTone} />
            </ModalFooter>
        </Modal>
    );
};

export default RecoveryScoreModal;
