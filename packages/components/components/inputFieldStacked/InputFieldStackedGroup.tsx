import clsx from '@proton/utils/clsx';

import './InputFieldStackedGroup.scss';

const InputFieldStackedGroup = ({ children, classname }: { children: React.ReactNode; classname?: string }) => (
    <div className={clsx('stacked-field-group', classname)}>{children}</div>
);

export default InputFieldStackedGroup;
