import { Children, Fragment, type ReactNode, isValidElement } from 'react';

const SettingsDivider = ({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) => {
    if (!enabled) {
        return children;
    }
    const result = Children.toArray(children).filter(isValidElement);
    return result.map((child, i, arr) => {
        return (
            <Fragment key={i}>
                {child}
                {i !== arr.length - 1 && <hr className="my-8" />}
            </Fragment>
        );
    });
};

export default SettingsDivider;
