import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe ser usado dentro de SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 👇 USAR useCallback PARA EVITAR RE-RENDERS INNECESARIOS
  const updateSearch = useCallback((term) => {
    const trimmedTerm = term?.trim() || '';
    setSearchTerm(trimmedTerm);
    setIsSearching(trimmedTerm.length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  return (
    <SearchContext.Provider value={{
      searchTerm,
      isSearching,
      updateSearch,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};