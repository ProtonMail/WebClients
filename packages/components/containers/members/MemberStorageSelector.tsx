import { c } from 'ttag';
import { ReactNode, useRef, useState } from 'react';
import { GIGA } from '@proton/shared/lib/constants';
import humanSize, { getLongSizeFormat, getSizeFormat, getUnit } from '@proton/shared/lib/helpers/humanSize';
import clamp from '@proton/utils/clamp';
import generateUID from '@proton/shared/lib/helpers/generateUID';
import { getVariableFromThemeColor, ThemeColor } from '@proton/colors';
import { Donut } from '@proton/atoms';
import Slider from '@proton/atoms/Slider/Slider';
import { Tooltip } from '../../components';
import InputField from '../../components/v2/field/InputField';
import { useElementRect } from '../../hooks';

export const getTotalStorage = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 }
) => {
    return {
        memberUsedSpace: memberUsedSpace,
        organizationUsedSpace: organizationAssignedSpace - memberMaxSpace,
        organizationMaxSpace: organizationMaxSpace,
    };
};

export const getStorageRange = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 }
) => {
    return {
        min: memberUsedSpace,
        max: organizationMaxSpace - organizationAssignedSpace + memberMaxSpace,
    };
};

interface Props {
    range: ReturnType<typeof getStorageRange>;
    totalStorage: ReturnType<typeof getTotalStorage>;
    value: number;
    sizeUnit: number;
    onChange: (value: number) => void;
    className?: string;
    mode?: 'init' | 'members';
}

const getNumberWithPrecision = (value: number, precision: number) => {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

const getDisplayedValue = (value: number, precision: number) => {
    return `${getNumberWithPrecision(value, precision).toFixed(precision)}`;
};

const stepInBytes = 0.1 * GIGA;

const getGraphValue = (value: number, total: number) => {
    // Round to a nice number to avoid float issues
    const percentage = Math.round((value / total) * 100);
    if (percentage < 1 || Number.isNaN(percentage)) {
        return 0;
    }
    return percentage;
};

interface Segment {
    label: string;
    size: ReactNode;
    tooltip: string;
    value: [number, ThemeColor];
}

const getSegments = (totalStorage: Props['totalStorage'], allocatedStorage: number): Segment[] => {
    const alreadyUsedPercentage = getGraphValue(totalStorage.memberUsedSpace, totalStorage.organizationMaxSpace);
    const alreadyAllocatedPercentage = getGraphValue(
        totalStorage.organizationUsedSpace,
        totalStorage.organizationMaxSpace
    );
    const allocatedPercentage = Math.min(
        getGraphValue(allocatedStorage, totalStorage.organizationMaxSpace),
        100 - (alreadyUsedPercentage + alreadyAllocatedPercentage)
    );

    return [
        {
            label: c('Info').t`Already used`,
            size: humanSize(totalStorage.memberUsedSpace),
            tooltip: c('Info').t`Storage used by this user`,
            value: [alreadyUsedPercentage, ThemeColor.Danger],
        },
        {
            label: c('Info').t`Already allocated`,
            size: humanSize(totalStorage.organizationUsedSpace),
            tooltip: c('Info').t`Storage allocated to other users in this organisation`,
            value: [alreadyAllocatedPercentage, ThemeColor.Warning],
        },
        {
            label: c('Info').t`Allocated`,
            size: humanSize(allocatedStorage),
            tooltip: c('Info').t`Storage allocated to this user`,
            value: [allocatedPercentage, ThemeColor.Success],
        },
    ];
};

const getValueInUnit = (value: number, sizeInBytes: number) => {
    return value / sizeInBytes;
};

const getValueInBytes = (value: number, sizeInUnits: number) => {
    return value * sizeInUnits;
};

const MemberStorageSelector = ({
    range,
    value,
    onChange,
    sizeUnit,
    totalStorage,
    className,
    mode = 'members',
}: Props) => {
    const actualValue = getValueInUnit(value, sizeUnit);
    const precision = 1;
    const [tmpValue, setTmpValue] = useState(getDisplayedValue(actualValue, precision));

    const min = getNumberWithPrecision(getValueInUnit(range.min, sizeUnit), precision);
    const max = getNumberWithPrecision(getValueInUnit(range.max, sizeUnit), precision);
    const step = getNumberWithPrecision(getValueInUnit(stepInBytes, sizeUnit), precision);

    const parsedValueInUnit = getNumberWithPrecision(Number.parseFloat(tmpValue), 1) || 0;
    const parsedValueInBytes = Math.floor(getValueInBytes(parsedValueInUnit, sizeUnit));

    const labelRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(labelRef);
    const sizeRef = useRef<HTMLDivElement>(null);
    const sizeRect = useElementRect(sizeRef);
    const [uid] = useState(generateUID('memberStorageSelector'));

    const segments = getSegments(totalStorage, parsedValueInBytes);
    const unit = getUnit(sizeUnit);

    const handleSafeChange = (value: number) => {
        if (Number.isNaN(value)) {
            // Reset to old value if it's invalid
            setTmpValue(getDisplayedValue(actualValue, precision));
            return;
        }
        const safeValue = clamp(value, min, max);
        setTmpValue(getDisplayedValue(safeValue, precision));
        onChange(clamp(Math.floor(getValueInBytes(safeValue, sizeUnit)), range.min, range.max));
    };

    const sizeElementWidth = 1;
    // We calculate a ratio because the modal has a transform animation which the getBoundingClientRect doesn't take into account
    const ratio = (sizeRect?.width || 0) / sizeElementWidth;
    const sizeLabel = getSizeFormat(unit, parsedValueInUnit);
    const sizeLabelSuffix = (
        <span id={uid} aria-label={getLongSizeFormat(unit, parsedValueInUnit)}>
            {sizeLabel}
        </span>
    );

    return (
        <div className={className}>
            <div className="flex on-tiny-mobile-flex-column">
                <div className="w30">
                    <InputField
                        value={tmpValue}
                        aria-label={c('Label').t`Account storage`}
                        aria-describedby={uid}
                        onValue={(value: string) => {
                            setTmpValue(value.replace(/[^\d.]/g, ''));
                        }}
                        onBlur={() => {
                            handleSafeChange(parsedValueInUnit);
                        }}
                        suffix={sizeLabelSuffix}
                    />
                </div>
                <div className="flex flex-item-fluid flex-justify-end">
                    {mode === 'members' ? (
                        <>
                            <div className="w-custom" style={{ '--width-custom': `${(rect?.height || 0) / ratio}px` }}>
                                <Donut segments={segments.map(({ value }) => value)} />
                            </div>
                            <div className="ml1 text-sm">
                                <div ref={labelRef}>
                                    <div ref={sizeRef} style={{ width: `${sizeElementWidth}px` }} />
                                    {segments.map(({ label, size, tooltip, value: [share, color] }) => (
                                        <div className="mb1 flex flex-align-items-center" key={tooltip}>
                                            <Tooltip
                                                title={
                                                    <>
                                                        {tooltip}
                                                        <br />({size})
                                                    </>
                                                }
                                            >
                                                <span
                                                    className="inline-block mr0-5 w2e rounded"
                                                    style={{ background: `var(${getVariableFromThemeColor(color)})` }}
                                                >
                                                    &nbsp;
                                                </span>
                                            </Tooltip>
                                            <span className="sr-only">
                                                {share} {sizeLabel}
                                            </span>
                                            <span className="text-semibold">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <b>{c('Info').t`Admin account allocation`}</b>: {humanSize(parsedValueInBytes, unit)}
                            </div>
                            <div>
                                <b>{c('Info').t`Storage for users`}</b>:{' '}
                                {humanSize(range.max - parsedValueInBytes, unit)}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="mt0-5">
                <Slider
                    marks
                    min={min}
                    max={max}
                    step={step}
                    aria-label={c('Label').t`Account storage`}
                    aria-describedby={uid}
                    value={parsedValueInUnit}
                    getDisplayedValue={(value) => getDisplayedValue(value, precision)}
                    onChange={handleSafeChange}
                />
            </div>
        </div>
    );
};

export default MemberStorageSelector;
