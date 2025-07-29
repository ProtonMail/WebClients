import { Button } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

export const EventDetailsRow = ({
    prefix,
    suffix,
    copySuccessText,
    linkMode,
}: {
    prefix: string;
    suffix: string;
    copySuccessText: string;
    linkMode?: boolean;
}) => {
    const { createNotification } = useNotifications();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        textToClipboard(suffix);
        createNotification({ text: copySuccessText });
    };

    if (linkMode) {
        return (
            <div className="flex flex-column items-start mb-2">
                <p className="m-0">{prefix}</p>
                <Button
                    shape="underline"
                    color="norm"
                    size="small"
                    className="p-0 block text-ellipsis max-w-full"
                    onClick={handleClick}
                >
                    {suffix}
                </Button>
            </div>
        );
    }

    return (
        <button type="button" className="flex text-ellipsis max-w-full" onClick={handleClick}>
            <p className="m-0 mr-1">{prefix}</p>
            <p className="m-0 text-ellipsis color-weak max-w-full" title={suffix}>
                {suffix}
            </p>
        </button>
    );
};
