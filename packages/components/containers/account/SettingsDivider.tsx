import { Children, type ReactNode, isValidElement } from 'react';

const SettingsDivider = ({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) => {
    if (!enabled) {
        return children;
    }
    const result = Children.toArray(children).filter(isValidElement);
    return result.map((child, i, arr) => {
        return (
            <>
                {child}
                {i !== arr.length - 1 && <hr className="my-8" />}
            </>
        );
    });
};

export default SettingsDivider;
