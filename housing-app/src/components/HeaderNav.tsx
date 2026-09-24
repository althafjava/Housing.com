"use client";

import { useState, type ReactNode } from "react";

/** Wraps the Research/Explore/Assistance nav, the header actions (passed as
 * children so DOM order matches the prototype exactly), and the mobile
 * hamburger toggle — all three share the same open/close state. */
export default function HeaderNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={`mainnav${open ? " mainnav--open" : ""}`} id="mainnav">
        <div className="mainnav__item">
          Research <i className="caret" />
        </div>
        <div className="mainnav__item">
          Explore <i className="caret" />
        </div>
        <div className="mainnav__item">
          Assistance <i className="caret" />
        </div>
      </nav>

      <div className="topbar__actions">
        {children}
        <button className="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </>
  );
}
