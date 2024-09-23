import type { ReactElement, ReactNode } from 'react';
import { cloneElement, useContext } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import type { ModalContentProps } from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import clsx from '@proton/utils/clsx';

import './Prompt.scss';

const PromptTitle = ({ children }: { children: ReactNode }) => (
    <h1 id={useContext(ModalContext).id} className="text-lg text-bold">
        {children}
    </h1>
);

export interface PromptProps extends Omit<ModalProps, 'children' | 'size' | 'title'> {
    title?: string | JSX.Element;
    subline?: string;
    footnote?: string | any[]; //need footnote to accept any[] for ttag with link as variable
    buttons: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | [JSX.Element, JSX.Element, JSX.Element];
    actions?: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element] | undefined;
    children: ReactNode;
    ModalContentProps?: ModalContentProps;
    'data-testid'?: string;
}

const Prompt = ({
    title,
    subline,
    footnote,
    buttons,
    actions,
    className,
    children,
    ModalContentProps,
    'data-testid': dataTestId,
    ...rest
}: PromptProps) => {
    const buttonArray = Array.isArray(buttons) ? buttons : [buttons];

    const [firstButton, secondButton, thirdButton] = buttonArray.map((child) =>
        cloneElement(child as ReactElement, { fullWidth: true })
    );

    const actionsContent = (() => {
        if (actions === undefined) {
            return null;
        }

        const actionsArray = Array.isArray(actions) ? actions : [actions];

        const [firstAction, secondAction] = actionsArray.map((child) => cloneElement(child as ReactElement));

        return (
            <div className="prompt-actions">
                <div className="flex flex-column gap-2">
                    {firstAction}
                    {secondAction}
                </div>
            </div>
        );
    })();

    return (
        <ModalTwo size="small" {...rest} className={clsx([className, 'prompt'])}>
            <div className="prompt-header" data-testid={dataTestId}>
                <PromptTitle>{title}</PromptTitle>
                {subline && <div className="color-weak text-break">{subline}</div>}
            </div>
            <ModalTwoContent {...ModalContentProps}>{children}</ModalTwoContent>
            {actionsContent}
            <ModalTwoFooter className="prompt-footer">
                <div className={clsx('flex gap-2', footnote && 'pb-2')}>
                    {firstButton}
                    {secondButton}
                    {thirdButton}
                </div>
                {footnote && <p className="color-weak text-break text-center text-sm">{footnote}</p>}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default Prompt;
