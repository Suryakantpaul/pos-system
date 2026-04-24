/**
 * productStore.js
 * Zustand store for product catalog & search
 */

import { create } from "zustand";

export const useProductStore = create((set, get) => ({
  products: [],
  searchResults: [],
  query: "",
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  categories: [],
  activeCategory: "all",

  setQuery: (query) => set({ query }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setProducts: (products) => set({ products, searchResults: products }),
  setSearchResults: (searchResults) => set({ searchResults }),

  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),

  setCategories: (categories) => set({ categories }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  appendProducts: (newProducts) =>
    set((state) => ({
      products: [...state.products, ...newProducts],
    })),

  reset: () =>
    set({
      products: [],
      searchResults: [],
      query: "",
      isLoading: false,
      error: null,
      page: 1,
      hasMore: true,
    }),
}));
