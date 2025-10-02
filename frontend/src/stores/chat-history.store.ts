import { atom } from 'jotai';
import { ChatHistoryItem } from '@/services/chat-history.service';

export interface ChatHistoryState {
  items: ChatHistoryItem[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
}

const initialChatHistoryState: ChatHistoryState = {
  items: [],
  isLoading: false,
  error: null,
  hasFetched: false,
};

export const chatHistoryAtom = atom<ChatHistoryState>(initialChatHistoryState);

// Derived atoms for easier access
export const chatHistoryItemsAtom = atom(
  (get) => get(chatHistoryAtom).items
);

export const chatHistoryLoadingAtom = atom(
  (get) => get(chatHistoryAtom).isLoading
);

export const chatHistoryErrorAtom = atom(
  (get) => get(chatHistoryAtom).error
);

export const chatHistoryHasFetchedAtom = atom(
  (get) => get(chatHistoryAtom).hasFetched
);

// Action atoms
export const setChatHistoryItemsAtom = atom(
  null,
  (get, set, items: ChatHistoryItem[]) => {
    set(chatHistoryAtom, {
      ...get(chatHistoryAtom),
      items,
      hasFetched: true,
    });
  }
);

export const setChatHistoryLoadingAtom = atom(
  null,
  (get, set, isLoading: boolean) => {
    set(chatHistoryAtom, {
      ...get(chatHistoryAtom),
      isLoading,
    });
  }
);

export const setChatHistoryErrorAtom = atom(
  null,
  (get, set, error: string | null) => {
    set(chatHistoryAtom, {
      ...get(chatHistoryAtom),
      error,
    });
  }
);

export const removeChatHistoryItemAtom = atom(
  null,
  (get, set, itemId: string) => {
    const currentState = get(chatHistoryAtom);
    const updatedItems = currentState.items.filter(item => item.id !== itemId);
    set(chatHistoryAtom, {
      ...currentState,
      items: updatedItems,
    });
  }
);

export const clearChatHistoryAtom = atom(
  null,
  (get, set) => {
    set(chatHistoryAtom, {
      ...get(chatHistoryAtom),
      items: [],
    });
  }
);
