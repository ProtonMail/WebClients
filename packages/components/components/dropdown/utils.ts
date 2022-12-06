enum UnitSuffix {
    px = 'px',
    em = 'em',
}

export enum DropdownSizeUnit {
    Anchor = 'anchor',
    Static = 'static',
    Dynamic = 'dynamic',
    Viewport = 'viewport',
}

export type Unit = `${number}${UnitSuffix}`;

export interface DropdownSize {
    width?: Exclude<DropdownSizeUnit, DropdownSizeUnit.Viewport> | Unit;
    height?: Exclude<DropdownSizeUnit, DropdownSizeUnit.Viewport | DropdownSizeUnit.Anchor> | Unit;
    maxWidth?: DropdownSizeUnit.Viewport | Unit;
    maxHeight?: DropdownSizeUnit.Viewport | Unit;
}

const getValue = (value: number | undefined, unit: keyof typeof UnitSuffix) => {
    if (value === undefined) {
        return;
    }
    return `${value}${unit}`;
};

export const getMaxSizeValue = (value: DropdownSize['maxWidth'] | Unit | undefined) => {
    if (value === undefined) {
        return;
    }
    return value === DropdownSizeUnit.Viewport ? 'initial' : value;
};

export const getWidthValue = (
    width: DropdownSize['width'] | undefined,
    anchorRect: DOMRect | null | undefined,
    contentRect: DOMRect | null | undefined
) => {
    if (width === undefined || width === DropdownSizeUnit.Static) {
        return getValue(contentRect?.width, 'px');
    }
    if (width === DropdownSizeUnit.Anchor) {
        return getValue(anchorRect?.width, 'px');
    }
    if (width === DropdownSizeUnit.Dynamic) {
        return;
    }
    return width;
};

export const getHeightValue = (
    height: DropdownSize['height'] | undefined,
    anchorRect: DOMRect | null | undefined,
    contentRect: DOMRect | null | undefined
) => {
    if (height === undefined || height === DropdownSizeUnit.Static) {
        return getValue(contentRect?.height, 'px');
    }
    if (height === DropdownSizeUnit.Dynamic) {
        return;
    }
    return height;
};

export const getProp = (prop: string, value: string | undefined) => {
    if (value === undefined) {
        return;
    }
    return { [prop]: value };
};
