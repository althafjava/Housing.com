import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import UserMenu from "@/components/UserMenu";

export interface HeaderUser {
  name: string | null;
  email: string;
}

export default function Header({ user }: { user: HeaderUser | null }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link href="/search" className="logo">
          <span className="logo__mark">
            india<em>property</em>
          </span>
          <span className="logo__tag">we get you home</span>
        </Link>

        <HeaderNav>
          <button className="icon-btn icon-btn--app" title="Download App" aria-label="Download App">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 3v10m0 0l-4-4m4 4l4-4M5 19h14"
                stroke="#fff"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button className="btn btn--outline" disabled title="Coming soon">
            Home Loan <span className="badge badge--new">new</span>
          </button>

          <Link href="/sell" className="btn btn--outline">
            Sell/Rent Property for Free
          </Link>

          <UserMenu user={user} />
        </HeaderNav>
      </div>
    </header>
  );
}
