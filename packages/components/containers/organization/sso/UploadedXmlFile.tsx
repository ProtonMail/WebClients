import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

interface Props {
    file: File;
    onRemoveClick: () => void;
}

const UploadedXmlFile = ({ file, onRemoveClick }: Props) => {
    return (
        <div className="rounded border border-weak flex items-center">
            <div className="p-1.5 flex items-center gap-2">
                <div className="p-1 bg-strong rounded-sm flex">
                    <Icon name="code" />
                </div>
                <span>{file.name}</span>
                <span className="color-weak">{shortHumanSize(file.size)}</span>
            </div>
            <Button className="shrink-0" icon shape="ghost" onClick={onRemoveClick}>
                <Icon name="cross-big" />
            </Button>
        </div>
    );
};

export default UploadedXmlFile;
