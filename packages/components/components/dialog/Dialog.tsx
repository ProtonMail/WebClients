import type { HTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

type Props = HTMLAttributes<HTMLDialogElement>;
const Dialog = forwardRef((props: Props, ref: Ref<HTMLDialogElement>) => <dialog ref={ref} {...props} />);
Dialog.displayName = 'Dialog';

export default Dialog;
