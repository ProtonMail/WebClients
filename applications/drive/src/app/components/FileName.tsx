import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';

const CHARACTERS_BEFORE_EXTENSION = 1; // The dot before the extension

// Handles extensions differently than FileNameDisplay used e.g. in mail
export const FileName = ({ text = '', className, testId }: { text?: string; className?: string; testId?: string }) => {
    const sanitized = rtlSanitize(text);
    const [, extension] = splitExtension(sanitized);

    const hasExtension = extension.length > 0;
    const charsToDisplayEnd = hasExtension ? extension.length + CHARACTERS_BEFORE_EXTENSION : 0;

    return (
        <MiddleEllipsis
            charsToDisplayEnd={charsToDisplayEnd}
            className={className}
            text={sanitized}
            displayTitle={false}
            displayTooltip
            data-testid={testId}
            splitOnlyTooLong
        />
    );
};
