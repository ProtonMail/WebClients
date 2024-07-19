import clsx from '@proton/utils/clsx';

import type { SubTitleProps } from '../../components/title/SubTitle';
import SubTitle from '../../components/title/SubTitle';

const SettingsSectionTitle = ({ className, ...rest }: SubTitleProps) => (
    <SubTitle className={clsx(className, 'text-bold mb-1')} {...rest} />
);

export default SettingsSectionTitle;
