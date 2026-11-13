// Like drive/docs/realtime's packages/docs-editor/src/DocsStyleScope.tsx: roots the module's Ariakit portals.

import * as Ariakit from '@ariakit/react'
import { type PropsWithChildren, useState } from 'react'

export type HomepageStyleScopeProps = PropsWithChildren

export function HomepageStyleScope({ children }: HomepageStyleScopeProps) {
  // The callback ref resolves after mount, so state is needed to update the portal provider.
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  return (
    <div className="contents">
      <Ariakit.PortalContext.Provider value={portalRoot}>{children}</Ariakit.PortalContext.Provider>
      {/* Above Proton's phone-width sidebar (z-index 800), below its modals and dropdowns (900). */}
      <div ref={setPortalRoot} className="fixed left-0 top-0 z-[850] h-0 w-0" />
    </div>
  )
}
