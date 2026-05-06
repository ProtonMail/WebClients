import { c } from 'ttag';

import { type RecoveryItemIds, selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCircleRadioEmpty } from '@proton/icons/icons/IcCircleRadioEmpty';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import clsx from '@proton/utils/clsx';

import SecureAccountButton from './SecureAccountButton';
import { getRecoveryScoreItemCopy } from './recoveryScoreCopy';
import { SCORE_TONE_CLASS, getRecoveryScoreTone } from './recoveryScoreState';

type RecoveryScoreModalItem = {
    id: RecoveryItemIds;
    label: string;
};

const RecoveryScoreModal = ({ onClose, ...rest }: ModalProps) => {
    const {
        recoveryScore: { score, maxScore },
        recoveryItems,
    } = useSelector(selectRecoveryState);
    const availableItems = recoveryItems.filter((item) => item.isAvailable);
    const checkedItems: RecoveryScoreModalItem[] = availableItems
        .filter((item) => item.isEnabled && item.countsTowardScore !== false)
        .map((item) => ({
            id: item.id,
            label: getRecoveryScoreItemCopy(item),
        }));
    const uncheckedItems: RecoveryScoreModalItem[] = availableItems
        .filter((item) => !item.isEnabled)
        .map((item) => ({
            id: item.id,
            label: getRecoveryScoreItemCopy(item),
        }));
    const inactiveItems: RecoveryScoreModalItem[] = availableItems
        .filter((item) => item.isEnabled && item.countsTowardScore === false)
        .map((item) => ({
            id: item.id,
            label: getRecoveryScoreItemCopy(item),
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
                <div className="flex flex-column gap-6">
                    {checkedItems.length > 0 && (
                        <div>
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
                    {inactiveItems.length > 0 && (
                        <div>
                            <h3 className="text-rg text-semibold mb-1">
                                {c('Recovery score').t`Inactive recovery options`}
                            </h3>
                            <p className="text-sm color-weak m-0 mb-2">
                                {c('Recovery score').t`Require verified password reset option (email or SMS)`}
                            </p>
                            <ul className="unstyled m-0">
                                {inactiveItems.map((item) => (
                                    <li key={item.id} className="flex items-center gap-2 py-1">
                                        <IcCheckmarkCircle size={4} className="shrink-0 color-hint" />
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
                                        {inactiveItems.length > 0 &&
                                        (item.id === 'recoveryEmail' || item.id === 'recoveryPhone') ? (
                                            <IcExclamationCircleFilled className="shrink-0 color-warning" />
                                        ) : (
                                            <IcCircleRadioEmpty className="shrink-0 color-hint" />
                                        )}
                                        <span className="text-sm">{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </ModalContent>

            <ModalFooter>
                {score < maxScore ? (
                    <SecureAccountButton fullWidth onClick={onClose} scoreTone={scoreTone} />
                ) : (
                    <Button fullWidth onClick={onClose} color="weak" shape="outline">
                        {c('Action').t`Close`}
                    </Button>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default RecoveryScoreModal;
