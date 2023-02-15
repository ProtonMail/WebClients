import { c, msgid } from 'ttag';

interface Props {
    errors: boolean;
}

const StepPrepareErrorBox = ({ errors }: Props) => {
    if (!errors) {
        return null;
    }

    return (
        <div
            className="rounded-lg p1 mt1 bg-danger color-white text-semibold border-none"
            data-testid="StepPrepareErrorBox:container"
        >
            {c('Error').ngettext(
                msgid`Please fix the highlighted conflict to proceed.`,
                `Please fix the highlighted conflicts to proceed.`,
                0
            )}
        </div>
    );
};

export default StepPrepareErrorBox;
