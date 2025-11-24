import { Search } from 'lucide-react'

const SearchBar = ({ placeholder = 'Search...', value, onChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pl-10"
      />
    </div>
  )
}

export default SearchBar



















