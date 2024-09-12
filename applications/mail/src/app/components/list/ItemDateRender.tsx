import { Tooltip } from '@proton/components';

interface Props {
    className?: string;
    useTooltip?: boolean;
    fullDate: string;
    formattedDate: string;
    dataTestId: string;
}

const ItemDateRender = ({ className, useTooltip, formattedDate, fullDate, dataTestId }: Props) => {
    const itemDate = (
        <>
            <time
                dateTime={fullDate}
                className={className}
                title={useTooltip ? undefined : fullDate}
                aria-hidden="true"
                data-testid={dataTestId}
            >
                {formattedDate}
            </time>
            <span className="sr-only">{fullDate}</span>
        </>
    );

    if (useTooltip) {
        return (
            <Tooltip title={fullDate}>
                <span>{itemDate}</span>
            </Tooltip>
        );
    }

    return <>{itemDate}</>;
};

export default ItemDateRender;
