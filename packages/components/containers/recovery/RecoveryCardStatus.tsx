import { ButtonLike, Icon, SettingsLink } from '../../components';
import RecoveryStatusIcon from './RecoveryStatusIcon';
import RecoveryStatusText from './RecoveryStatusText';

export interface RecoveryCardStatusProps {
    type: 'info' | 'success' | 'warning' | 'danger';
    statusText: string;
    callToActions?: {
        text: string;
        path: string;
    }[];
}

const RecoveryCardStatus = ({ type, statusText, callToActions: items = [] }: RecoveryCardStatusProps) => {
    return (
        <>
            <span className="flex flex-align-items-center flex-nowrap">
                <RecoveryStatusIcon className="flex-item-noshrink" type={type} />
                <RecoveryStatusText className="ml1" type={type}>
                    {statusText}
                </RecoveryStatusText>
            </span>

            {items.length > 0 && (
                <ul className="unstyled ml4">
                    {items.map(({ text, path }) => {
                        return (
                            <li key={text} className="flex flex-align-items-center flex-nowrap">
                                <span className="mr0-5">{text}</span>
                                <ButtonLike as={SettingsLink} icon path={path} shape="ghost" color="norm" size="small">
                                    <Icon name="arrow-right" />
                                </ButtonLike>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
};

export default RecoveryCardStatus;
