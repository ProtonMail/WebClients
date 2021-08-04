import { c } from 'ttag';
import { DENSITY } from '@proton/shared/lib/constants';
import { updateDensity } from '@proton/shared/lib/api/settings';

import { useUserSettings, useApi, useLoading, useEventManager, useNotifications } from '../../hooks';
import { FormModal } from '../../components';
import DensityRadiosCards from '../layouts/DensityRadiosCards';

import './ModalSettingsLayoutCards.scss';

interface Props {
    onClose?: () => void;
}

const MailDensityModal = ({ ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ Density }] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Mailbox density`;

    const handleChangeDensity = async (density: DENSITY) => {
        await api(updateDensity(density));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => rest.onClose?.();

    return (
        <FormModal title={title} intermediate close={null} submit={c('Action').t`OK`} onSubmit={handleSubmit} {...rest}>
            <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                <span className="mb1" id="densityMode_desc">
                    {c('Label').t`Select how your list of messages looks like by default.`}
                </span>
                <DensityRadiosCards
                    density={Density}
                    describedByID="densityMode_desc"
                    onChange={(value) => withLoading(handleChangeDensity(value))}
                    loading={loading}
                    liClassName="w100"
                    className="layoutCards-two-per-row"
                />
            </div>
        </FormModal>
    );
};

export default MailDensityModal;
