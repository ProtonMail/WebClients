import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';

const CHARACTERS_BEFORE_EXTENSION = 3;

interface Props {
    text?: string;
    className?: string;
    charsToDisplayEnd?: number;
    displayTooltip?: boolean;
    testId?: string;
}

// todo missing testid
const FileNameDisplay = ({ text = '', className, charsToDisplayEnd = 6, displayTooltip = true, testId }: Props) => {
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
            displayTooltip={displayTooltip}
            data-testid={testId}
        />
    );
};

export default FileNameDisplay;
