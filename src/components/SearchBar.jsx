import { Search } from 'lucide-react'

const SearchBar = ({ placeholder = 'Search...', value, onChange }) => {
  return (
    <div className="relative min-w-[180px] flex-1">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pl-8"
      />
    </div>
  )
}

export default SearchBar
