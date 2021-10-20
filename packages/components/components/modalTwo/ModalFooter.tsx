import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';
import './ModalFooter.scss'

const ModalFooter = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={classnames([ className, 'modal-two-footer flex-item-noshrink flex flex-justify-space-between'])} {...rest} />
)

export default ModalFooter
