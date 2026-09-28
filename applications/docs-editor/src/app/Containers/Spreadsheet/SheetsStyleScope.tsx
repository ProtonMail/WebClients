import * as Ariakit from '@ariakit/react'
import { type PropsWithChildren, useState } from 'react'

import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import './spreadsheet.scss'

export function SheetsStyleScope({ children }: PropsWithChildren) {
  // The callback ref resolves after mount, so state is needed to update the portal provider.
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  return (
    <div className="sheets-editor-root">
      <Ariakit.PortalContext.Provider value={portalRoot}>{children}</Ariakit.PortalContext.Provider>
      <div ref={setPortalRoot} className="sheets-editor-portal-root" />
    </div>
  )
}
