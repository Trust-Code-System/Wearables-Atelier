import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { authService } from "../lib/auth";

export interface WishlistItem {
  slug: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  img: string;
}

type State = { items: WishlistItem[] };
type Action =
  | { type: "TOGGLE"; item: WishlistItem }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: WishlistItem[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TOGGLE": {
      const exists = state.items.some((i) => i.slug === action.item.slug);
      return {
        items: exists
          ? state.items.filter((i) => i.slug !== action.item.slug)
          : [...state.items, action.item],
      };
    }
    case "LOAD":
      return { items: action.items };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface WishlistContextValue {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  isWishlisted: (slug: string) => boolean;
  clearWishlist: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function storageKey(uid: string | null) {
  return uid ? `wba_demo_wishlist_${uid}` : "wba_demo_wishlist_guest";
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Track auth state and reload wishlist when user changes
  useEffect(() => {
    void authService.getSession().then(({ data: { session } }) => {
      const newUid = session?.user?.id ?? null;
      setUid(newUid);
      try {
        const saved = localStorage.getItem(storageKey(newUid));
        dispatch({ type: "LOAD", items: saved ? JSON.parse(saved) : [] });
      } catch {
        dispatch({ type: "LOAD", items: [] });
      }
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED") return;
      const newUid = session?.user?.id ?? null;
      setUid(newUid);
      try {
        const saved = localStorage.getItem(storageKey(newUid));
        dispatch({ type: "LOAD", items: saved ? JSON.parse(saved) : [] });
      } catch {
        dispatch({ type: "LOAD", items: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey(uid), JSON.stringify(state.items));
  }, [state.items, uid, hydrated]);

  function toggle(item: WishlistItem) {
    dispatch({ type: "TOGGLE", item });
  }

  function isWishlisted(slug: string) {
    return state.items.some((i) => i.slug === slug);
  }

  function clearWishlist() {
    dispatch({ type: "CLEAR" });
  }

  return (
    <WishlistContext.Provider value={{ items: state.items, toggle, isWishlisted, clearWishlist, count: state.items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
