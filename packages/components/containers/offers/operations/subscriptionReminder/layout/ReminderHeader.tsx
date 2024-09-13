import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

interface Props {
    title: string;
    description?: string;
    onClose: () => void;
}

const ReminderHeader = ({ title, description, onClose }: Props) => {
    return (
        <section className="text-center">
            <h2 className="text-lg text-bold">{title}</h2>
            {description && <p className="text-sm my-0 color-hint mt-1 mb-6">{description}</p>}
            <Button icon shape="ghost" onClick={onClose} className="absolute top-0 right-0 mt-3 mr-3">
                <Icon name="cross-big" alt={c('Action').t`Close`} />
            </Button>
        </section>
    );
};

export default ReminderHeader;
