import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import { updateDensity } from '@proton/shared/lib/api/settings';
import type { DENSITY } from '@proton/shared/lib/constants';

import { useApi, useEventManager, useNotifications, useUserSettings } from '../../hooks';
import DensityRadiosCards from '../layouts/DensityRadiosCards';

import './ModalSettingsLayoutCards.scss';

const MailDensityModal = (props: ModalProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ Density }] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Mailbox density`;

    const { onClose } = props;

    const handleChangeDensity = async (density: DENSITY) => {
        await api(updateDensity(density));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => onClose?.();

    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap mb-4">
                    <span className="mb-4" id="densityMode_desc">
                        {c('Label').t`Select what your list of messages looks like by default.`}
                    </span>
                    <DensityRadiosCards
                        density={Density}
                        describedByID="densityMode_desc"
                        onChange={(value) => withLoading(handleChangeDensity(value))}
                        loading={loading}
                        liClassName="w-full"
                        className="layoutCards-two-per-row"
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" color="norm" onClick={handleSubmit}>{c('Action').t`OK`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MailDensityModal;
