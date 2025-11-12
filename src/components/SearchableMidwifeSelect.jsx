import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SearchableMidwifeSelect = ({ 
  midwives = [], 
  value, 
  onChange, 
  placeholder = "Select a midwife...", 
  className = "",
  disabled = false,
  onOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredMidwives, setFilteredMidwives] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected midwife by name primarily (since we store names in the form)
  const selectedMidwife = midwives.find(midwife => 
    String(midwife.name) === String(value) ||
    String(midwife.id) === String(value) || 
    String(midwife.user_id) === String(value)
  );

  // Filter midwives based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = midwives.filter(midwife => {
        const name = (midwife.name || '').toLowerCase();
        const email = (midwife.email || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) || email.includes(searchLower);
      });
      
      setFilteredMidwives(filtered);
    } else {
      setFilteredMidwives(midwives);
    }
  }, [searchTerm, midwives]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle midwife selection
  const handleMidwifeSelect = (midwife) => {
    onChange(midwife.id || midwife.user_id, midwife.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = () => {
    onChange('', '');
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    if (typeof onOpen === 'function') {
      onOpen();
    }
    if (selectedMidwife) {
      setSearchTerm('');
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMidwives.length === 1) {
        handleMidwifeSelect(filteredMidwives[0]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedMidwife ? selectedMidwife.name : '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
          }`}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedMidwife && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded"
              title="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              const next = !isOpen;
              setIsOpen(next);
              if (next && typeof onOpen === 'function') onOpen();
            }}
            className={`p-2 text-gray-400 ${!disabled ? 'hover:text-gray-600' : 'cursor-not-allowed'}`}
            disabled={disabled}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search header when dropdown is open */}
          {searchTerm && (
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center text-sm text-gray-600">
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Searching for: "{searchTerm}"
              </div>
            </div>
          )}

          {filteredMidwives.length > 0 ? (
            filteredMidwives.map((midwife) => (
              <button
                key={midwife.id || midwife.user_id}
                type="button"
                onClick={() => handleMidwifeSelect(midwife)}
                className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                  selectedMidwife?.id === midwife.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedMidwife?.id === midwife.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <UserIcon className={`w-4 h-4 ${
                      selectedMidwife?.id === midwife.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {midwife.name}
                  </p>
                  {midwife.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {midwife.email}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {searchTerm 
                  ? `No midwives found matching "${searchTerm}"`
                  : 'No midwives available'
                }
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default SearchableMidwifeSelect;
