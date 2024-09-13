import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

import { SettingsLink } from '../../components';
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
            <span className="flex items-center flex-nowrap">
                <RecoveryStatusIcon className="shrink-0" type={type} />
                <RecoveryStatusText className="ml-4" type={type}>
                    {statusText}
                </RecoveryStatusText>
            </span>

            {items.length > 0 && (
                <ul className="unstyled ml-14">
                    {items.map(({ text, path }) => {
                        return (
                            <li key={text} className="flex items-center flex-nowrap">
                                <span className="mr-2">{text}</span>
                                <ButtonLike
                                    as={SettingsLink}
                                    icon
                                    path={path}
                                    shape="ghost"
                                    color="norm"
                                    size="small"
                                    title={text}
                                >
                                    <Icon name="arrow-right" alt={text} />
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
