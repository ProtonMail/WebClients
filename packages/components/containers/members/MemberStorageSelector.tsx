import type { KeyboardEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Donut } from '@proton/atoms';
import { Slider } from '@proton/atoms';
import { ThemeColor, getVariableFromThemeColor } from '@proton/colors';
import { PLANS } from '@proton/shared/lib/constants';
import humanSize, { getLongSizeFormat, getSizeFormat, getUnit } from '@proton/shared/lib/helpers/humanSize';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import clamp from '@proton/utils/clamp';
import generateUID from '@proton/utils/generateUID';

import { Tooltip } from '../../components';
import InputField from '../../components/v2/field/InputField';
import { useElementRect } from '../../hooks';

export const getTotalStorage = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 } = {}
) => {
    return {
        memberUsedSpace: memberUsedSpace,
        organizationUsedSpace: organizationAssignedSpace - memberMaxSpace,
        organizationMaxSpace: organizationMaxSpace,
    };
};

const getDefaultInitialStorage = (organization: Organization | undefined) => {
    const isFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';
    if (isFamilyOrg || organization?.PlanName === PLANS.VISIONARY) {
        return 500 * sizeUnits.GB;
    }
    if ([PLANS.DRIVE_PRO, PLANS.DRIVE_BUSINESS].includes(organization?.PlanName as any)) {
        return sizeUnits.TB;
    }
    return 5 * sizeUnits.GB;
};

export const getInitialStorage = (
    organization: Organization | undefined,
    storageRange: {
        min: number;
        max: number;
    }
) => {
    const result = getDefaultInitialStorage(organization);
    if (result <= storageRange.max) {
        return result;
    }
    return 5 * sizeUnits.GB;
};

export const getStorageRange = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 } = {}
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
    disabled?: boolean;
    orgInitialization?: boolean;
}

const getNumberWithPrecision = (value: number, precision: number) => {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

const getDisplayedValue = (value: number, precision: number) => {
    return `${getNumberWithPrecision(value, precision).toFixed(precision)}`;
};

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
            size: humanSize({ bytes: totalStorage.memberUsedSpace }),
            tooltip: c('Info').t`Storage used by this user`,
            value: [alreadyUsedPercentage, ThemeColor.Danger],
        },
        {
            label: c('Info').t`Already allocated`,
            size: humanSize({ bytes: totalStorage.organizationUsedSpace }),
            tooltip: c('Info').t`Storage allocated to other users in this organisation`,
            value: [alreadyAllocatedPercentage, ThemeColor.Warning],
        },
        {
            label: c('Info').t`Allocated`,
            size: humanSize({ bytes: allocatedStorage }),
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
    disabled,
    orgInitialization = false,
}: Props) => {
    const actualValue = getValueInUnit(value, sizeUnit);
    const precision = 1;
    const [tmpValue, setTmpValue] = useState(getDisplayedValue(actualValue, precision));

    // We change the step depending on the remaining space
    const remainingSpace = totalStorage.organizationMaxSpace - totalStorage.organizationUsedSpace;
    const stepInBytes = remainingSpace > sizeUnits.GB ? 0.5 * sizeUnits.GB : 0.1 * sizeUnits.GB;

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
            <div className="flex flex-column sm:flex-row">
                <div className="w-3/10">
                    <InputField
                        label={c('Label').t`Account storage`}
                        disableChange={disabled}
                        value={tmpValue}
                        aria-label={c('Label').t`Account storage`}
                        data-testid="member-storage-selector"
                        aria-describedby={uid}
                        onValue={(value: string) => {
                            setTmpValue(value.replace(/[^\d.]/g, ''));
                        }}
                        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === 'Enter') {
                                handleSafeChange(parsedValueInUnit);
                            }
                        }}
                        onBlur={() => {
                            handleSafeChange(parsedValueInUnit);
                        }}
                        suffix={sizeLabelSuffix}
                    />
                </div>
                <div className="flex sm:flex-1 justify-end self-start">
                    {orgInitialization ? (
                        <>
                            <div>
                                <b>{c('Info').t`Admin account allocation`}</b>:{' '}
                                {humanSize({
                                    bytes: parsedValueInBytes,
                                    unit,
                                })}
                            </div>
                            <div>
                                <b>{c('Info').t`Storage for users`}</b>:{' '}
                                {humanSize({ bytes: range.max - parsedValueInBytes, unit })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-custom" style={{ '--w-custom': `${(rect?.height || 0) / ratio}px` }}>
                                <Donut segments={segments.map(({ value }) => value)} />
                            </div>
                            <div className="ml-4 text-sm">
                                <div ref={labelRef}>
                                    <div ref={sizeRef} style={{ width: `${sizeElementWidth}px` }} />
                                    {segments.map(({ label, size, tooltip, value: [share, color] }) => (
                                        <div className="mb-4 flex items-center" key={tooltip}>
                                            <Tooltip
                                                openDelay={0}
                                                title={
                                                    <>
                                                        {tooltip}
                                                        <br />({size})
                                                    </>
                                                }
                                            >
                                                <span
                                                    className="inline-block user-select-none mr-2 w-custom rounded"
                                                    style={{
                                                        background: `var(${getVariableFromThemeColor(color)})`,
                                                        '--w-custom': '2em',
                                                    }}
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
                    )}
                </div>
            </div>
            <div className="mt-2 pr-2 md:pr-0">
                <Slider
                    marks
                    disabled={disabled}
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
