"use client";

import { useState } from "react";
import { ASSETS, Img, type GoTo } from "./shared";

const SIZES = ["Small", "Medium", "Large"];
const CRUSTS = ["Thin", "Regular"];
const TOPPINGS = ["Pepperoni", "Kale", "Mushrooms", "Extra cheese"];

type Popup = "none" | "menu" | "thanks";

/* Only allow numbers, and add the dashes automatically: 123-456-7890 */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/* 1994: Pizza Hut's PizzaNet.
   Delivery form → Pizza Menu popup → Thank You popup → "New Message" notification */
export default function PizzaHut({ goTo }: { goTo: GoTo }) {
  // delivery details
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // pizza choices
  const [size, setSize] = useState("");
  const [crust, setCrust] = useState("");
  const [toppings, setToppings] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [popup, setPopup] = useState<Popup>("none");

  // notification: shows after an order is placed and the popup is closed
  const [ordered, setOrdered] = useState(false);
  const [notificationClosed, setNotificationClosed] = useState(false);
  const showNotification = ordered && popup === "none" && !notificationClosed;

  function toggleTopping(topping: string) {
    setToppings((current) =>
      current.includes(topping)
        ? current.filter((t) => t !== topping)
        : [...current, topping],
    );
  }

  function resetChoices() {
    setSize("");
    setCrust("");
    setToppings([]);
    setError("");
  }

  const chosenToppings = TOPPINGS.filter((t) => toppings.includes(t));

  return (
    <main className="p-page">
      <Img className="p-logo" src={ASSETS.pizzaHutLogo} alt="Pizza Hut" />

      <h1 className="p-title">Welcome to Pizza Hut!</h1>

      <p className="p-intro">
        This Electronic Storefront is brought to you by Pizza Hut® and{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          The Santa Cruz Operation®.
        </a>{" "}
        You may click on the Pizza Hut logo on any page to submit comments
        regarding this service to webmaster@PizzaHut.COM
      </p>

      <hr className="p-rule" />

      <p className="p-ask">
        If you would like to order a pizza to be delivered, please provide the
        following information:
      </p>

      {/* Step 1: delivery details. Continue opens the Pizza Menu popup */}
      <form
        className="p-form"
        onSubmit={(e) => {
          e.preventDefault();
          setPopup("menu");
        }}
      >
        <label className="p-label" htmlFor="p-name">
          Name
        </label>
        <input
          id="p-name"
          className="p-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="p-label" htmlFor="p-address">
          Street Address
        </label>
        <input
          id="p-address"
          className="p-input"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <label className="p-label" htmlFor="p-phone">
          Voice Phone ###-###-####
        </label>
        <div className="p-field-note">
          <input
            id="p-phone"
            className="p-input p-input-short"
            type="tel"
            inputMode="numeric"
            placeholder="123-456-7890"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            required
          />
          <span className="p-note">(where we can reach you)</span>
        </div>

        <button className="p-btn p-form-btn" type="submit">
          Continue
        </button>
      </form>

      <hr className="p-rule" />

      <Img className="p-sco" src={ASSETS.sco} alt="SCO Open Systems Software" />

      {/* Step 2 + 3: popups */}
      {popup !== "none" && (
        <div className="p-overlay">
          <div
            className="p-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="p-popup-title"
          >
            <button
              className="p-close"
              type="button"
              aria-label="Close"
              onClick={() => setPopup("none")}
            >
              ×
            </button>

            {popup === "menu" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!size || !crust) {
                    setError("Please select a size and a crust.");
                    return;
                  }
                  setError("");
                  setOrdered(true);
                  setPopup("thanks");
                }}
              >
                <h2 id="p-popup-title">Pizza Menu</h2>
                <p>Hello {name || "Guest"}! Please select your pizza:</p>

                <hr />

                <div className="p-options">
                  <div
                    className="p-group"
                    role="radiogroup"
                    aria-labelledby="p-size-label"
                  >
                    <span className="p-group-label" id="p-size-label">
                      Size:
                    </span>
                    <div className="p-choices">
                      {SIZES.map((s) => (
                        <label key={s}>
                          <input
                            type="radio"
                            name="size"
                            value={s}
                            checked={size === s}
                            onChange={() => setSize(s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div
                    className="p-group"
                    role="radiogroup"
                    aria-labelledby="p-crust-label"
                  >
                    <span className="p-group-label" id="p-crust-label">
                      Crust:
                    </span>
                    <div className="p-choices">
                      {CRUSTS.map((c) => (
                        <label key={c}>
                          <input
                            type="radio"
                            name="crust"
                            value={c}
                            checked={crust === c}
                            onChange={() => setCrust(c)}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="p-group-label p-toppings-title">Toppings:</p>
                <div className="p-toppings">
                  {TOPPINGS.map((t) => (
                    <label key={t}>
                      <input
                        type="checkbox"
                        checked={toppings.includes(t)}
                        onChange={() => toggleTopping(t)}
                      />
                      {t}
                    </label>
                  ))}
                </div>

                {error && <p className="p-error">{error}</p>}

                <hr />

                <div className="p-popup-buttons">
                  <button className="p-btn" type="submit">
                    Submit Order
                  </button>
                  <button
                    className="p-btn"
                    type="button"
                    onClick={resetChoices}
                  >
                    Reset
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h2 id="p-popup-title">Thank You!</h2>
                <p>
                  Your order has been received and sent to your local Pizza Hut
                  store.
                </p>

                <hr />

                <div className="p-receipt">
                  <div className="p-row">
                    <span>Order for:</span>
                    <span>{name}</span>
                  </div>
                  <div className="p-row">
                    <span>Deliver to:</span>
                    <span>{address}</span>
                  </div>
                  <div className="p-row">
                    <span>Phone:</span>
                    <span>{phone}</span>
                  </div>
                  <div className="p-gap" />
                  <div>
                    1&nbsp;&nbsp;{size} {crust} crust
                  </div>
                  <div>
                    {chosenToppings.length
                      ? chosenToppings.join(", ")
                      : "No toppings"}
                  </div>
                  <div className="p-gap" />
                  <div className="p-row">
                    <span>Payment:</span>
                    <span>Cash on delivery</span>
                  </div>
                </div>

                <hr />

                <p className="p-confirm">
                  <b>
                    A store employee will call you at the number above to
                    confirm your order.
                  </b>
                  <br />
                  Your pizza will not be prepared until your order has been
                  confirmed by telephone.
                </p>

                <button
                  className="p-btn"
                  type="button"
                  onClick={() => setPopup("none")}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: "New Message" notification. Clicking it opens MySpace */}
      {showNotification && (
        <div className="n-toast" role="status">
          <div className="n-head">
            <Img className="n-chat" src={ASSETS.chatIcon} alt="" />
            <span className="n-title">New Message</span>
            <button
              className="n-x"
              type="button"
              aria-label="Close notification"
              onClick={() => setNotificationClosed(true)}
            >
              X
            </button>
          </div>

          <button
            className="n-body"
            type="button"
            onClick={() => goTo("myspace")}
          >
            <Img className="n-photo" src={ASSETS.profilePic} alt="" />
            <span className="n-text">
              <span className="n-line">
                <Img className="n-envelope" src={ASSETS.envelope} alt="" />
                <span>
                  <b>@Stansino_Oers67</b> updated his status.
                </span>
              </span>
              <span className="n-cta">Go check it out!</span>
            </span>
          </button>
        </div>
      )}
    </main>
  );
}
