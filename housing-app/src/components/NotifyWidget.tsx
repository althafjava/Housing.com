"use client";

import { useState } from "react";

/** "Let us find the property for you" pill + modal from the prototype.
 * Messaging/alerts are out of scope for this plan (see implementation_plan.md
 * Scope), so this renders the full UI for visual completeness but the submit
 * button is a no-op rather than calling a real subscription endpoint. */
export default function NotifyWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="notify-pill"
        aria-haspopup="dialog"
        aria-controls="notifyModal"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24">
          <path
            d="M12 22a2.2 2.2 0 002.2-2.2h-4.4A2.2 2.2 0 0012 22zM18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1z"
            fill="#fff"
          />
        </svg>
      </button>

      <div className={`modal-overlay${open ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notifyTitle">
          <button className="modal__close" aria-label="Close" onClick={() => setOpen(false)}>
            &times;
          </button>

          <h2 id="notifyTitle" className="modal__title">
            Let us find the property for you
          </h2>
          <p className="modal__sub">Get notified when properties matching your requirement are available</p>

          <div className="modal__city">CHENNAI</div>
          <div className="modal__filters">
            <input type="text" placeholder="Type Your Locality" />
            <select defaultValue="">
              <option value="">All Residential</option>
              <option value="APARTMENT">Apartment/Flat</option>
              <option value="VILLA">Independent House/Villa</option>
            </select>
            <select defaultValue="">
              <option value="">Any Price</option>
              <option>Under 20 Lacs</option>
              <option>20 - 50 Lacs</option>
              <option>50 Lacs - 1 Cr</option>
            </select>
            <select defaultValue="">
              <option value="">Any BHK</option>
              <option>1 BHK</option>
              <option>2 BHK</option>
              <option>3 BHK</option>
            </select>
          </div>

          <div className="modal__signup">
            <p className="modal__signup-title">Sign Up and Get Notified</p>
            <div className="modal__signup-grid">
              <div className="modal__social">
                <button className="btn btn--google" type="button" disabled title="Coming soon">
                  <span className="g-icon">G+</span> SIGN UP WITH GOOGLE
                </button>
                <button className="btn btn--facebook" type="button" disabled title="Coming soon">
                  <span className="f-icon">f</span> SIGN UP WITH FACEBOOK
                </button>
              </div>
              <div className="modal__or">or</div>
              <div className="modal__form">
                <input type="text" placeholder="Name" />
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <div className="modal__phone">
                  <select className="modal__cc" defaultValue="+91">
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <input type="tel" placeholder="Mobile Number" />
                </div>
              </div>
            </div>
            <button className="btn btn--getnotified" type="button" disabled title="Alerts are coming soon">
              GET NOTIFIED
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
