import type { ReactElement } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import humanSize from '@proton/shared/lib/helpers/humanSize';

interface Props {
    file: File;
    icon: ReactElement;
    className?: string;
    clear?: string;
    onClear?: () => void;
}

const AttachedFile = ({ file, icon, className, clear, onClear, ...rest }: Props) => {
    const [fileName, extension] = splitExtension(file.name);

    return (
        <div className={`flex border w-full rounded ${className}`} {...rest}>
            <div className="p-1 flex shrink-0 w-1/10">
                <span className="m-auto flex">{icon}</span>
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
