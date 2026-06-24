import React from 'react'

export default function SheetsLayout({ children }: React.PropsWithChildren) {
  return <div className="relative grid h-full w-full overflow-hidden bg-[white]">{children}</div>
}
