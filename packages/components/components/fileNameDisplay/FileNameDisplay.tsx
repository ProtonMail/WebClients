import { splitExtension } from '@proton/shared/lib/helpers/file';
import { MiddleEllipsis } from '../ellipsis';

const CHARACTERS_BEFORE_EXTENSION = 3;

interface Props {
    text?: string;
    className?: string;
    charsToDisplayEnd?: number;
}

const FileNameDisplay = ({ text = '', className, charsToDisplayEnd = 6 }: Props) => {
    const [, extension] = splitExtension(text);
    const extensionOffset =
        extension.length < charsToDisplayEnd ? extension.length + CHARACTERS_BEFORE_EXTENSION : charsToDisplayEnd;
    return <MiddleEllipsis charsToDisplayEnd={extensionOffset} className={className} text={text} />;
};

export default FileNameDisplay;
