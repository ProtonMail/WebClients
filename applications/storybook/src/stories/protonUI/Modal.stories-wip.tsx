import { PrimaryButton, ConfirmModal, useModals } from '@proton/components';
import { getTitle } from '../../helpers/title';

export default { component: ConfirmModal, title: getTitle(__filename) };

export const Basic = () => {
    const { createModal } = useModals();

    const handleClick = () => {
        createModal(<ConfirmModal />);
    };

    return <PrimaryButton onClick={handleClick}>Open modal</PrimaryButton>;
};
