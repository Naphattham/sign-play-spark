import { useRef, useState, useEffect, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Navbar, type NavbarHandle } from "@/components/Navbar";

// ─── Context ──────────────────────────────────────────────────────────────────
interface NavbarContextValue {
  openLogin: () => void;
}

const NavbarContext = createContext<NavbarContextValue>({ openLogin: () => { } });

export function useNavbarContext() {
  return useContext(NavbarContext);
}

// ─── Layout ───────────────────────────────────────────────────────────────────
/**
 * Shared layout for public pages (/ and /categories).
 * Renders <Navbar> exactly once so it never unmounts during route transitions —
 * keeping the running-character GIF animation alive seamlessly.
 *
 * When the user is authenticated (Index shows the game UI), the layout becomes
 * a transparent pass-through so the public Navbar doesn't overlap the game.
 */
export function PublicLayout() {
  const navbarRef = useRef<NavbarHandle>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsub;
  }, []);

  // While auth state is loading, render nothing to avoid flash
  if (isAuthenticated === null) return null;

  return (
    <NavbarContext.Provider value={{ openLogin: () => navbarRef.current?.openLogin() }}>
      <div className={isAuthenticated ? "w-full min-h-[100dvh]" : "h-[100dvh] flex flex-col text-foreground cb-hero-bg dot-grid overflow-hidden"}>
        <div className={isAuthenticated ? "w-full h-full" : "flex-1 overflow-y-auto scroll-smooth"} style={isAuthenticated ? {} : { WebkitOverflowScrolling: "touch" }}>
          {!isAuthenticated && <Navbar ref={navbarRef} />}
          <Outlet />
        </div>
      </div>
    </NavbarContext.Provider>
  );
}
