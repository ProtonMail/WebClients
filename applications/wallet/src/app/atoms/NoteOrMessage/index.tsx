import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

interface Props {
    handleClick: () => void;
    value?: string;
    type: 'message' | 'note';
}

export const NoteOrMessage = ({ handleClick, value, type }: Props) => {
    return (
        <Button
            className="text-pre-wrap rounded-2xl w-full px-4 py-3 border-none color-norm min-h-custom"
            style={{ '--min-h-custom': '5rem' }}
            onClick={handleClick}
        >
            <span className="flex flex-nowrap items-start gap-4 p-1">
                <div
                    className="bg-strong self-center rounded-full flex h-custom w-custom shrink-0"
                    style={{
                        '--w-custom': '2rem',
                        '--h-custom': '2rem',
                    }}
                >
                    <Icon name={type === 'message' ? 'speech-bubble' : 'note'} className="m-auto" />
                </div>
                <div className="flex flex-column gap-1 text-left">
                    <span className="color-weak">
                        {type === 'message'
                            ? c('Wallet send').t`Message to recipient (optional)`
                            : c('Wallet send').t`Add private note to myself`}
                    </span>
                    {value ? (
                        <span className="text-left text-break pr-2">{value}</span>
                    ) : (
                        <span className="color-hint">
                            {type === 'message' ? c('Wallet send').t`Add a message` : c('Wallet send').t`Add a note`}
                        </span>
                    )}
                </div>
            </span>
        </Button>
    );
};
