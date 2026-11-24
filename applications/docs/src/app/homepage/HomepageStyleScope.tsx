import * as Ariakit from '@ariakit/react'
import { type PropsWithChildren, useState } from 'react'

import './HomepageStyleScope.css'

export type HomepageStyleScopeProps = PropsWithChildren

export function HomepageStyleScope({ children }: HomepageStyleScopeProps) {
  // The callback ref resolves after mount, so state is needed to update the portal provider.
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  return (
    <div className="homepage-root contents">
      <Ariakit.PortalContext.Provider value={portalRoot}>{children}</Ariakit.PortalContext.Provider>
      {/* Above the sidebar's drawer (z-index 800), below Proton's modals and dropdowns (900) in the Docs app. */}
      <div ref={setPortalRoot} className="fixed left-0 top-0 z-[850] h-0 w-0" />
    </div>
  )
}
