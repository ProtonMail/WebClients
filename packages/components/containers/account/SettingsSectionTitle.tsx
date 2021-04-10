import React from 'react';

import SubTitle, { SubTitleProps } from '../../components/title/SubTitle';
import { classnames } from '../../helpers';

const SettingsSectionTitle = ({ className, ...rest }: SubTitleProps) => (
    <SubTitle className={classnames([className, 'text-bold'])} {...rest} />
);

export default SettingsSectionTitle;
