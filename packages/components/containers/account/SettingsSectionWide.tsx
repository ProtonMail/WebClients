import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionWide = ({
    className,
    customWidth = '69em',
    ...rest
}: ComponentPropsWithoutRef<'div'> & {
    customWidth?: string;
}) => {
    return <div className={clsx(['max-w-custom', className])} style={{ '--max-w-custom': customWidth }} {...rest} />;
};

export default SettingsSectionWide;
