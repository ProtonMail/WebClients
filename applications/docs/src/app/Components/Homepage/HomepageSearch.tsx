import { Input } from '@proton/atoms'
import './HomepageSearch.scss'
import { c } from 'ttag'
import { Icon } from '@proton/components'

export const HomepageSearch = ({ onSearchTextChange }: { onSearchTextChange: (searchText: string) => void }) => (
  <div className="homepage-search">
    <Input
      className="bg-weak"
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
