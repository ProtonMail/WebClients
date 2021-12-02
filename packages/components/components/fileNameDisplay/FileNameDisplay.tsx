import { splitExtension } from '@proton/shared/lib/helpers/file';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { MiddleEllipsis } from '../ellipsis';

const CHARACTERS_BEFORE_EXTENSION = 3;

interface Props {
    text?: string;
    className?: string;
    charsToDisplayEnd?: number;
}

const FileNameDisplay = ({ text = '', className, charsToDisplayEnd = 6 }: Props) => {
    const sanitized = rtlSanitize(text);
    const [, extension] = splitExtension(sanitized);
    const extensionOffset =
        extension.length < charsToDisplayEnd ? extension.length + CHARACTERS_BEFORE_EXTENSION : charsToDisplayEnd;
    return (
        <MiddleEllipsis
            charsToDisplayEnd={extensionOffset}
            className={className}
            text={sanitized}
            displayTitle={false}
            displayTooltip
        />
    );
};

export default FileNameDisplay;
