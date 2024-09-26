import { Button } from '@proton/atoms';
import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import humanSize from '@proton/shared/lib/helpers/humanSize';

interface Props {
    file: File;
    iconName: IconName;
    className?: string;
    clear?: string;
    onClear?: () => void;
}

const AttachedFile = ({ file, iconName, className, clear, onClear, ...rest }: Props) => {
    const [fileName, extension] = splitExtension(file.name);

    return (
        <div className={`flex border w-full rounded ${className}`} {...rest}>
            <div className="p-1 flex shrink-0 w-1/10">
                <Icon name={iconName} className="m-auto" />
            </div>
            <div className="message-attachmentInfo p-2 flex flex-nowrap w-9/10">
                <div className="flex-1 pr-4">
                    <div className="text-ellipsis" title={fileName}>
                        {fileName}
                    </div>
                    <div>{`${extension.toUpperCase()} - ${humanSize({ bytes: file.size })}`}</div>
                </div>
                {clear && onClear && (
                    <Button className="shrink-0" onClick={onClear}>
                        {clear}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AttachedFile;
