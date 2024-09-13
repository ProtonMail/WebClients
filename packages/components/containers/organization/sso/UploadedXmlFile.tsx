import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

interface Props {
    file: File;
    onRemoveClick: () => void;
}

const UploadedXmlFile = ({ file, onRemoveClick }: Props) => {
    return (
        <div className="rounded border border-weak flex flex-nowrap items-center max-w-full">
            <div className="p-1.5 flex flex-nowrap items-center gap-2" title={file.name}>
                <div className="p-1 bg-strong rounded-sm flex shrink-0">
                    <Icon name="code" />
                </div>
                <span className="text-ellipsis">{file.name}</span>
                <span className="color-weak shrink-0">{shortHumanSize(file.size)}</span>
            </div>
            <Button className="shrink-0" icon shape="ghost" onClick={onRemoveClick}>
                <Icon name="cross-big" />
            </Button>
        </div>
    );
};

export default UploadedXmlFile;
