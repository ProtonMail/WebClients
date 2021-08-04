import { c } from 'ttag';
import { Icon } from '../../../components';

interface Props {
    title: string;
    onBack?: () => void;
}

const SubscriptionModalHeader = ({ title, onBack }: Props) => {
    return (
        <div className="flex flex-nowrap flex-align-items-center">
            <div className="flex-item-fluid">
                {onBack ? (
                    <button type="button" onClick={() => onBack()}>
                        <Icon name="arrow-left" alt={c('Action').t`Back`} />
                    </button>
                ) : null}
            </div>
            <div className="flex-item-fluid flex-item-grow-2 text-center text-bold">{title}</div>
            <div className="flex-item-fluid" />
        </div>
    );
};

export default SubscriptionModalHeader;
