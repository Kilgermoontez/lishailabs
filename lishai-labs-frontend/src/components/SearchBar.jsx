import { useCallback, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

export function SearchBar({ 
  items = [], 
  onSearch = () => {}, 
  placeholder = 'Search...',
  searchFields = ['title', 'name', 'email', 'description'],
  debounceMs = 300
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onSearch([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );

    setResults(filtered);
    onSearch(filtered);
  }, [items, searchFields, onSearch]);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [query, performSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onSearch([]);
  };

  return (
    <div className={`search-bar ${isActive ? 'active' : ''}`}>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setTimeout(() => setIsActive(false), 200)}
          aria-label="Search items"
        />
        {query && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {query && results.length > 0 && (
        <div className="search-results-preview">
          <div className="search-results-count">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
      
      {query && results.length === 0 && (
        <div className="search-results-preview">
          <div className="search-no-results">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
