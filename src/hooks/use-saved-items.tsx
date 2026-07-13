import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const FAVORITE_AGENCIES_KEY = '@kosher-pass:favorite_agencies';
const SHOPPING_LIST_KEY = '@kosher-pass:shopping_list';

export interface ShoppingListItem {
  productId: number;
  quantity: number;
  purchased: boolean;
}

interface SavedItemsContextType {
  favoriteAgencies: string[];
  toggleFavoriteAgency: (agencyId: string) => void;
  isFavoriteAgency: (agencyId: string) => boolean;

  shoppingList: ShoppingListItem[];
  addToShoppingList: (productId: number) => void;
  removeFromShoppingList: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  togglePurchased: (productId: number) => void;
  clearPurchased: () => void;
  isInShoppingList: (productId: number) => boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const [favoriteAgencies, setFavoriteAgencies] = useState<string[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [favoritesJson, listJson] = await Promise.all([
          AsyncStorage.getItem(FAVORITE_AGENCIES_KEY),
          AsyncStorage.getItem(SHOPPING_LIST_KEY),
        ]);

        if (favoritesJson) {
          const parsed = JSON.parse(favoritesJson) as unknown;
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            setFavoriteAgencies(parsed);
          }
        }

        if (listJson) {
          const parsed = JSON.parse(listJson) as unknown;
          if (Array.isArray(parsed)) {
            setShoppingList(parsed as ShoppingListItem[]);
          }
        }
      } catch (error) {
        console.error('Failed to load saved items', error);
      } finally {
        setIsLoaded(true);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(FAVORITE_AGENCIES_KEY, JSON.stringify(favoriteAgencies)).catch(error => {
      console.error('Failed to save favorite agencies', error);
    });
  }, [favoriteAgencies, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList)).catch(error => {
      console.error('Failed to save shopping list', error);
    });
  }, [shoppingList, isLoaded]);

  const toggleFavoriteAgency = useCallback((agencyId: string) => {
    setFavoriteAgencies(prev =>
      prev.includes(agencyId) ? prev.filter(id => id !== agencyId) : [...prev, agencyId]
    );
  }, []);

  const isFavoriteAgency = useCallback(
    (agencyId: string) => favoriteAgencies.includes(agencyId),
    [favoriteAgencies]
  );

  const addToShoppingList = useCallback((productId: number) => {
    setShoppingList(prev => {
      if (prev.some(item => item.productId === productId)) return prev;
      return [...prev, { productId, quantity: 1, purchased: false }];
    });
  }, []);

  const removeFromShoppingList = useCallback((productId: number) => {
    setShoppingList(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return;
    setShoppingList(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity } : item))
    );
  }, []);

  const togglePurchased = useCallback((productId: number) => {
    setShoppingList(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, purchased: !item.purchased } : item
      )
    );
  }, []);

  const clearPurchased = useCallback(() => {
    setShoppingList(prev => prev.filter(item => !item.purchased));
  }, []);

  const isInShoppingList = useCallback(
    (productId: number) => shoppingList.some(item => item.productId === productId),
    [shoppingList]
  );

  return (
    <SavedItemsContext.Provider
      value={{
        favoriteAgencies,
        toggleFavoriteAgency,
        isFavoriteAgency,
        shoppingList,
        addToShoppingList,
        removeFromShoppingList,
        updateQuantity,
        togglePurchased,
        clearPurchased,
        isInShoppingList,
      }}>
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  return context;
}
