import React from 'react';
import {Icon, MimeIcon} from 'react-components';
import iconSvg from 'design-system/_includes/sprite-icons.svg';
import mimeSvg from 'design-system/_includes/mime-icons.svg';
import {Meta} from '@storybook/react/types-6-0';

export default { title: 'Proton UI / Icons' } as Meta;

export const PrimaryIcons = () => {
    const primaryIconNames = iconSvg.match(/id="shape-([^"]+)/g).map((x: string) => x.replace('id="shape-', ''));
    return (
        <div className="flex mb2">
            {primaryIconNames.map((iconName: string) => (
                <div className="w200p aligncenter p1">
                    <Icon name={iconName} size={24}/>
                    <code className="bl mt0-5">
                        {iconName}
                    </code>
                </div>)
            )}
        </div>
    )
}

export const MimeIcons = () => {
    const mimeIconNames = mimeSvg.match(/id="mime-([^"]+)/g).map((x: string) => x.replace('id="mime-', ''));
    return (
        <div className="flex mb2">
            {mimeIconNames.map((iconName: string) => (
                <div className="w200p aligncenter p1">
                    <MimeIcon name={iconName} size={24}/>
                    <code className="bl mt0-5">
                        {iconName}
                    </code>
                </div>)
            )}
        </div>
    )
}
