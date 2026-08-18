import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { SavedItemsProvider, useSavedItems } from './use-saved-items';

/**
 * The shopping list is the only data the app owns rather than mirrors, and it
 * is read back from storage written by an older build. These tests cover the
 * validation boundary: a malformed entry must be dropped, never cast into
 * state, where it crashes at render on `item.quantity`.
 */

const SHOPPING_LIST_KEY = '@kosher-pass:shopping_list';
const FAVORITE_AGENCIES_KEY = '@kosher-pass:favorite_agencies';

function wrapper({ children }: { children: ReactNode }) {
  return <SavedItemsProvider>{children}</SavedItemsProvider>;
}

async function renderSavedItems() {
  // `renderHook` is async in RNTL 14 (React 19 concurrent rendering).
  const view = await renderHook(() => useSavedItems(), { wrapper });
  // The provider then hydrates from AsyncStorage.
  await waitFor(() => expect(view.result.current).toBeTruthy());
  return view;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('persisted shopping list', () => {
  it('drops entries that do not match the current shape', async () => {
    await AsyncStorage.setItem(
      SHOPPING_LIST_KEY,
      JSON.stringify([
        { productId: 1, quantity: 2, purchased: false },
        { productId: 'two', quantity: 1, purchased: false }, // wrong type
        { productId: 3 }, // missing fields
        { productId: 4, quantity: 0, purchased: false }, // impossible quantity
        null,
      ])
    );

    const { result } = await renderSavedItems();

    await waitFor(() => expect(result.current.shoppingList).toHaveLength(1));
    expect(result.current.shoppingList[0].productId).toBe(1);
  });

  it('survives corrupt JSON without throwing', async () => {
    await AsyncStorage.setItem(SHOPPING_LIST_KEY, '{not json');

    const { result } = await renderSavedItems();

    await waitFor(() => expect(result.current.shoppingList).toEqual([]));
  });

  it('rejects a favourites payload that is not an array of strings', async () => {
    await AsyncStorage.setItem(FAVORITE_AGENCIES_KEY, JSON.stringify(['KMD', 7]));

    const { result } = await renderSavedItems();

    await waitFor(() => expect(result.current.favoriteAgencies).toEqual([]));
  });
});

describe('shopping list operations', () => {
  it('adds a product once, ignoring duplicates', async () => {
    const { result } = await renderSavedItems();

    await act(async () => {
      result.current.addToShoppingList(10);
      result.current.addToShoppingList(10);
    });

    expect(result.current.shoppingList).toHaveLength(1);
    expect(result.current.isInShoppingList(10)).toBe(true);
  });

  it('refuses to drop a quantity below 1', async () => {
    const { result } = await renderSavedItems();

    await act(async () => result.current.addToShoppingList(10));
    expect(result.current.shoppingList).toHaveLength(1);

    await act(async () => result.current.updateQuantity(10, 0));

    // A zero-quantity row would render a stepper the user cannot recover from;
    // removal is an explicit action, not a side effect of decrementing.
    expect(result.current.shoppingList[0].quantity).toBe(1);
  });

  it('clears only the purchased items', async () => {
    const { result } = await renderSavedItems();

    await act(async () => {
      result.current.addToShoppingList(1);
      result.current.addToShoppingList(2);
    });
    expect(result.current.shoppingList).toHaveLength(2);

    await act(async () => result.current.togglePurchased(1));
    await act(async () => result.current.clearPurchased());

    expect(result.current.shoppingList).toHaveLength(1);
    expect(result.current.shoppingList[0].productId).toBe(2);
  });
});

describe('favourite agencies', () => {
  it('toggles on and off', async () => {
    const { result } = await renderSavedItems();

    await act(async () => result.current.toggleFavoriteAgency('KMD'));
    expect(result.current.isFavoriteAgency('KMD')).toBe(true);

    await act(async () => result.current.toggleFavoriteAgency('KMD'));
    expect(result.current.isFavoriteAgency('KMD')).toBe(false);
  });
});
