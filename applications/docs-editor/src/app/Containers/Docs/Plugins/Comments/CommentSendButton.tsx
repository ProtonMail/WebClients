import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import type { IconButtonProps } from '../../Components/ui'
import { IconButton } from '../../Components/ui'

export interface CommentSendButtonProps extends Omit<IconButtonProps, 'children'> {}

/** Its padding is in `em`, so it is 24px square only at the composer's 14px font. */
export function CommentSendButton(props: CommentSendButtonProps) {
  return (
    <IconButton color="norm" size="small" pill {...props}>
      <Icon data={Icons.arrowUp} size={3} />
    </IconButton>
  )
}
