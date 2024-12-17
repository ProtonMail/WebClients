import { Input } from '@proton/atoms'
import { c } from 'ttag'
import { Icon } from '@proton/components'

export const HomepageSearch = ({ onSearchTextChange }: { onSearchTextChange: (searchText: string) => void }) => (
  <div className="mt-1 max-w-[490px] md:mt-0">
    <Input
      className="bg-weak"
      inputClassName="h-[32px] md:h-auto"
      prefix={
        <span>
          <Icon size={5} color="weak" name="magnifier" alt={c('Action').t`Search`} />
        </span>
      }
      onChange={(e) => onSearchTextChange(e.target.value)}
      placeholder={c('Action').t`Search docs`}
    />
  </div>
)
