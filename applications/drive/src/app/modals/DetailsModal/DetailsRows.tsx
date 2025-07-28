import { FileNameDisplay, Row, TimeIntl } from '@proton/components';
import humanSize, { bytesSize } from '@proton/shared/lib/helpers/humanSize';

export function FileNameRow({ label, name }: { label: string; name: string }) {
    return (
        <DetailsRow label={label}>
            <FileNameDisplay text={name} />
        </DetailsRow>
    );
}

export function TimeRow({ label, time }: { label: string; time: Date }) {
    return (
        <DetailsRow label={label}>
            <TimeIntl
                options={{
                    year: 'numeric',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                }}
            >
                {time}
            </TimeIntl>
        </DetailsRow>
    );
}

export function SizeRow({ label, size, dataTestId }: { label: string; size: number; dataTestId?: string }) {
    return (
        <DetailsRow label={label} dataTestId={dataTestId}>
            <span title={bytesSize(size)}>{humanSize({ bytes: size })}</span>
        </DetailsRow>
    );
}

export function TextRow({
    label,
    text,
    dataTestId,
}: {
    label: React.ReactNode;
    text: React.ReactNode;
    dataTestId?: string;
}) {
    return (
        <DetailsRow label={label} dataTestId={dataTestId}>
            {text}
        </DetailsRow>
    );
}

interface RowProps {
    label: React.ReactNode;
    dataTestId?: string;
    children: React.ReactNode;
}

function DetailsRow({ label, children, dataTestId }: RowProps) {
    return (
        <Row>
            <span className="label cursor-default">{label}</span>
            <div className="pt-2" data-testid={dataTestId}>
                <b>{children}</b>
            </div>
        </Row>
    );
}
