import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import { PrivateMainSettingsAreaBase } from './PrivateMainSettingsArea';
import { SettingsCardMaxWidth, SettingsLayoutVariant } from './interface';

interface Props {
    title: string;
    description?: ReactNode;
    backTo: string;
    backLabel: string;
    children: ReactNode;
    variant?: SettingsLayoutVariant;
    wrapperClass?: string;
    mainAreaClass?: string;
    maxWidth?: SettingsCardMaxWidth;
}

const PrivateMainSubSettingsArea = ({
    title,
    description,
    backTo,
    backLabel,
    children,
    variant = SettingsLayoutVariant.Card,
    wrapperClass,
    mainAreaClass,
    maxWidth = SettingsCardMaxWidth.Wide,
}: Props) => {
    return (
        <PrivateMainSettingsAreaBase
            title={title}
            description={description}
            wrapperClass={wrapperClass}
            mainAreaClass={mainAreaClass}
            maxWidth={maxWidth}
            variant={variant}
            backButton={
                <ButtonLike as={Link} to={backTo} shape="ghost" color="weak" size="small" icon>
                    <IcArrowLeft title={backLabel} />
                </ButtonLike>
            }
        >
            {children}
        </PrivateMainSettingsAreaBase>
    );
};

export default PrivateMainSubSettingsArea;
