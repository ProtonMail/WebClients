import clsx from '@proton/utils/clsx';

import SubTitle, { SubTitleProps } from '../../components/title/SubTitle';

const SettingsSectionTitle = ({ className, ...rest }: SubTitleProps) => (
    <SubTitle className={clsx(className, 'text-bold mb-1')} {...rest} />
);

export default SettingsSectionTitle;
