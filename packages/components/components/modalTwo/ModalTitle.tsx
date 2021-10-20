import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';

const ModalTitle = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <h3 className={classnames([ className, 'text-bold' ])} {...rest} />
)

export default ModalTitle
