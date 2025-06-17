import { type FC, useMemo } from 'react';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { type CustomTemplate, getGroupedTemplates } from './Custom.templates';

type Props = { onSelect: (template: CustomTemplate) => Promise<void> };

export const CustomSelect: FC<Props> = ({ onSelect }) =>
    useMemo(getGroupedTemplates, []).map(({ label, theme, templates }) => (
        <div key={label} className={clsx(theme, 'mb-4')}>
            <div className="mb-2 color-weak">{label}</div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {templates.map((template) => (
                    <Button
                        key={template.label}
                        pill
                        color="weak"
                        shape="solid"
                        className="w-full"
                        onClick={() => onSelect(template)}
                    >
                        <div className="flex items-center w-full text-left flex-nowrap">
                            <Icon name={template.icon} className="shrink-0 mr-2" />
                            <span className="text-ellipsis">{template.label}</span>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    ));
