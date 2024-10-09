import type { ReactNode } from 'react'

import { PrivateAppContainer, PrivateMainArea } from '@proton/components'

import DocsHeader from '../../Components/DocsHeader/DocsHeader'
import type { DocumentAction } from '@proton/drive-store'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
}

export const PublicLayout = ({ children, action }: Props) => {
  return (
    <PrivateAppContainer top={null} header={<DocsHeader action={action} />} sidebar={null} drawerApp={null}>
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}

export default PublicLayout
