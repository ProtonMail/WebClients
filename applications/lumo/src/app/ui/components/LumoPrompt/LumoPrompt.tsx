import type { ReactNode } from 'react';

import { Prompt, type PromptProps } from '@proton/components';

import './LumoPrompt.scss';

interface LumoPromptProps extends Omit<PromptProps, 'children'> {
    buttons: PromptProps['buttons'];
    image: {
        src: string;
        alt?: string;
        width?: string;
        height?: string;
    };
    title: string;
    info: string | any[];
    lumoContent?: ReactNode;
}

export const LumoPrompt = ({ buttons, image, title, info, lumoContent, ...modalProps }: LumoPromptProps) => {
    return (
        <Prompt {...modalProps} buttons={buttons}>
            <div className="flex flex-column flex-nowrap gap-4">
                <div className="flex items-center flex-column gap-4">
                    <img
                        className="h-custom w-custom"
                        src={image.src}
                        alt={image.alt || ''}
                        style={{
                            '--w-custom': image.width || '12.5rem ',
                            '--h-custom': image.height || '7.5rem',
                        }}
                    />
                    <div className="flex flex-column items-center">
                        <span className="lumo-prompt-title block text-bold text-center">{title}</span>
                    </div>
                </div>
                <p className="color-weak text-center m-0">{info}</p>
                {lumoContent && <>{lumoContent}</>}
            </div>
        </Prompt>
    );
};
