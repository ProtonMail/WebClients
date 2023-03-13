import { MailImportPayloadError } from '@proton/activation/src/interface';
import { LabelStack } from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces';

import StepPrepareEmailsSummaryError from './StepPrepareOAuthEmailsSummaryError';

interface Props {
    errors: MailImportPayloadError[];
    label: Pick<Label, 'Color' | 'Name' | 'Type'>;
    summary: string;
}

const StepPrepareEmailsSummaryText = ({ errors, summary, label }: Props) => {
    return (
        <>
            {errors.length > 0 ? (
                <StepPrepareEmailsSummaryError errors={errors} />
            ) : (
                <div className="color-weak" data-testid="StepPrepareEmailsSummary:summary">
                    <span>
                        {summary}{' '}
                        <LabelStack
                            key="label"
                            labels={[
                                {
                                    name: label.Name,
                                    color: label.Color,
                                },
                            ]}
                        />
                    </span>
                </div>
            )}
        </>
    );
};

export default StepPrepareEmailsSummaryText;
