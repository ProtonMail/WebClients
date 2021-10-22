import { cloneElement, ComponentPropsWithRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { Icon } from '../icon';
import { Button } from '../button';
import { Vr } from '../vr';
import { ModalContext } from './Modal';
import './ModalHeader.scss';

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    title?: string;
    subline?: string;
    actions?: [JSX.Element] | [JSX.Element, JSX.Element];
    onBack?: () => void;
}

const ModalHeader = ({ title, subline, actions: actionsProp, onBack, ...rest }: ModalHeaderProps) => {
    const { id, onClose } = useContext(ModalContext);

    const actions = actionsProp?.map((button) => cloneElement(button, { icon: true, shape: 'ghost', size: 'medium' }));

    return (
        <div
            className={classnames([
                'modal-two-header flex flex-nowrap flex-item-noshrink flex-justify-space-between flex-align-items-start',
                onBack && 'modal-two-header--with-back',
            ])}
            {...rest}
        >
            {onBack && (
                <div className="flex-item-noshrink">
                    <Button className="flex-item-noshrink" icon shape="ghost" onClick={onBack}>
                        <Icon className="modal-close-icon" name="arrow-left" />
                    </Button>
                </div>
            )}

            {title && (
                <div className={classnames(['mt0-5', onBack && 'text-center'])}>
                    <h3 id={id} className="text-lg text-bold">
                        {title}
                    </h3>
                    {subline && <div className="color-weak">{subline}</div>}
                </div>
            )}

            <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                {actions && (
                    <>
                        {actions} <Vr className="my0-25" />
                    </>
                )}

                <Button className="flex-item-noshrink" icon shape="ghost" onClick={onClose}>
                    <Icon className="modal-close-icon" name="xmark" />
                </Button>
            </div>
        </div>
    );
};

export default ModalHeader;
