import * as Ariakit from '@ariakit/react'
import { type PropsWithChildren, useState } from 'react'

import './docs.scss'

export function DocsStyleScope({ children }: PropsWithChildren) {
  // The callback ref resolves after mount, so state is needed to update the portal provider.
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  return (
    <div className="docs-editor-root contents text-[--text-norm]">
      <Ariakit.PortalContext.Provider value={portalRoot}>{children}</Ariakit.PortalContext.Provider>
      {/* Out of grid sizing, at the viewport origin, above the comments sidebar (z-30). */}
      <div ref={setPortalRoot} className="docs-editor-portal-root fixed left-0 top-0 z-40 h-0 w-0" />
    </div>
  )
}
