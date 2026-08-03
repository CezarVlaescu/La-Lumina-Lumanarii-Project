"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "../lib/catalog";
import {
  orderStatusLabels,
  orderStatuses,
  paymentMethodLabels,
  paymentStatusLabels,
  type AdminOrder,
  type OrderStatus,
} from "../lib/order-types";
import { shippingMethodLabels } from "../lib/shipping";

type AdminOrdersProps = {
  orders: AdminOrder[];
  onChange: (orders: AdminOrder[]) => void;
};

const emailKindLabels: Record<AdminOrder["emails"][number]["kind"], string> = {
  customer_order_confirmation: "Confirmare către client",
  admin_new_order: "Notificare comandă nouă",
  customer_status_update: "Actualizare status către client",
};

const emailStatusLabels: Record<AdminOrder["emails"][number]["status"], string> =
  {
    pending: "În curs",
    sent: "Trimis",
    failed: "Eșuat",
    not_configured: "Necesită configurare",
  };

function dateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function responseJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Operațiunea nu a reușit.");
  }
  return result;
}

export function AdminOrders({ orders, onChange }: AdminOrdersProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const visibleOrders = useMemo(() => {
    const search = query.toLocaleLowerCase("ro").trim();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!search) return true;
      return [
        order.orderNumber,
        order.customerFirstName,
        order.customerLastName,
        order.customerEmail,
        order.customerPhone,
        order.city,
      ]
        .join(" ")
        .toLocaleLowerCase("ro")
        .includes(search);
    });
  }, [orders, query, status]);

  async function changeStatus(order: AdminOrder, nextStatus: OrderStatus) {
    if (order.status === nextStatus) return;
    if (
      nextStatus === "cancelled" &&
      !window.confirm(
        `Anulezi comanda ${order.orderNumber}? Stocul produselor va fi refăcut.`,
      )
    ) {
      return;
    }

    setUpdatingId(order.id);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const result = await responseJson<{ order: AdminOrder }>(response);
      const nextOrders = orders.map((candidate) =>
        candidate.id === result.order.id ? result.order : candidate,
      );
      onChange(nextOrders);
      setSelectedOrder((current) =>
        current?.id === result.order.id ? result.order : current,
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Comanda nu a putut fi actualizată.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function retryEmail(order: AdminOrder, deliveryId: string) {
    setUpdatingId(`email:${deliveryId}`);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.id)}/emails`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deliveryId }),
        },
      );
      const result = await responseJson<{ order: AdminOrder }>(response);
      const nextOrders = orders.map((candidate) =>
        candidate.id === result.order.id ? result.order : candidate,
      );
      onChange(nextOrders);
      setSelectedOrder(result.order);
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Emailul nu a putut fi retrimis.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <>
      <section className="admin-panel admin-orders-panel">
        <div className="admin-panel__heading">
          <div>
            <p>Comenzi</p>
            <h2>{orders.length} comenzi înregistrate</h2>
          </div>
          <Link className="admin-export" href="/api/admin/orders/export">
            Exportă CSV
          </Link>
        </div>

        <div className="admin-order-tools">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după număr, client, email sau telefon"
            aria-label="Caută comenzi"
          />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | OrderStatus)
            }
            aria-label="Filtrează după status"
          >
            <option value="all">Toate statusurile</option>
            {orderStatuses.map((item) => (
              <option value={item} key={item}>
                {orderStatusLabels[item]}
              </option>
            ))}
          </select>
          <span>{visibleOrders.length} rezultate</span>
        </div>

        {error && <p className="admin-alert admin-alert--error">{error}</p>}

        {visibleOrders.length ? (
          <div className="admin-orders admin-orders--full">
            <div className="admin-orders__header">
              <span>Comandă</span>
              <span>Client</span>
              <span>Data</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {visibleOrders.map((order) => (
              <div className="admin-order-row" key={order.id}>
                <button
                  className="admin-order-link"
                  onClick={() => setSelectedOrder(order)}
                >
                  {order.orderNumber}
                </button>
                <span>
                  <strong>
                    {order.customerFirstName} {order.customerLastName}
                  </strong>
                  <small>{order.customerEmail}</small>
                </span>
                <span>{dateTime(order.createdAt)}</span>
                <span>
                  <strong>{formatPrice(order.total)}</strong>
                  <small>
                    {paymentMethodLabels[order.paymentMethod]} ·{" "}
                    {paymentStatusLabels[order.paymentStatus]}
                  </small>
                  <small>{shippingMethodLabels[order.shippingMethod]}</small>
                </span>
                <select
                  className={`order-status order-status--${order.status}`}
                  value={order.status}
                  disabled={
                    updatingId === order.id || order.status === "cancelled"
                  }
                  onChange={(event) =>
                    changeStatus(order, event.target.value as OrderStatus)
                  }
                  aria-label={`Status pentru ${order.orderNumber}`}
                >
                  {orderStatuses.map((item) => (
                    <option
                      value={item}
                      key={item}
                      disabled={
                        order.paymentMethod === "stripe" &&
                        order.paymentStatus !== "paid" &&
                        item !== "new" &&
                        item !== "cancelled"
                      }
                    >
                      {orderStatusLabels[item]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-orders-empty">
            <span>◇</span>
            <h3>Nicio comandă în acest filtru.</h3>
            <p>Comenzile trimise din checkout vor apărea automat aici.</p>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="admin-editor-backdrop" role="presentation">
          <section
            className="admin-editor admin-order-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
          >
            <header>
              <div>
                <p>Detalii comandă</p>
                <h2 id="order-detail-title">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Închide detaliile"
              >
                ×
              </button>
            </header>
            <div className="admin-editor__body">
              <div className="admin-order-detail__top">
                <div>
                  <span>Plasată</span>
                  <strong>{dateTime(selectedOrder.createdAt)}</strong>
                </div>
                <div>
                  <span>Plată</span>
                  <strong>
                    {paymentMethodLabels[selectedOrder.paymentMethod]}
                  </strong>
                  <small
                    className={`payment-state payment-state--${selectedOrder.paymentStatus}`}
                  >
                    {paymentStatusLabels[selectedOrder.paymentStatus]}
                  </small>
                </div>
                <label>
                  <span>Status</span>
                  <select
                    value={selectedOrder.status}
                    disabled={
                      updatingId === selectedOrder.id ||
                      selectedOrder.status === "cancelled"
                    }
                    onChange={(event) =>
                      changeStatus(
                        selectedOrder,
                        event.target.value as OrderStatus,
                      )
                    }
                  >
                    {orderStatuses.map((item) => (
                      <option
                        value={item}
                        key={item}
                        disabled={
                          selectedOrder.paymentMethod === "stripe" &&
                          selectedOrder.paymentStatus !== "paid" &&
                          item !== "new" &&
                          item !== "cancelled"
                        }
                      >
                        {orderStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="admin-order-detail__grid">
                <section>
                  <p>Date client</p>
                  <h3>
                    {selectedOrder.customerFirstName}{" "}
                    {selectedOrder.customerLastName}
                  </h3>
                  <a href={`mailto:${selectedOrder.customerEmail}`}>
                    {selectedOrder.customerEmail}
                  </a>
                  <a href={`tel:${selectedOrder.customerPhone}`}>
                    {selectedOrder.customerPhone}
                  </a>
                </section>
                <section>
                  <p>{shippingMethodLabels[selectedOrder.shippingMethod]}</p>
                  <h3>
                    {selectedOrder.shippingPointName ??
                      selectedOrder.addressLine}
                  </h3>
                  <span>
                    {selectedOrder.postalCode} {selectedOrder.city},{" "}
                    {selectedOrder.county}
                  </span>
                  <span>{selectedOrder.country}</span>
                </section>
              </div>

              {selectedOrder.customerNote && (
                <section className="admin-order-note">
                  <p>Observații client</p>
                  <span>{selectedOrder.customerNote}</span>
                </section>
              )}

              <section className="admin-order-emails">
                <div className="admin-order-emails__heading">
                  <div>
                    <p>Emailuri automate</p>
                    <span>
                      Confirmarea inițială și actualizările trimise clientului.
                    </span>
                  </div>
                  <strong>
                    {
                      selectedOrder.emails.filter(
                        (email) => email.status === "sent",
                      ).length
                    }
                    /{selectedOrder.emails.length} trimise
                  </strong>
                </div>
                {selectedOrder.emails.length ? (
                  <div className="admin-order-emails__list">
                    {selectedOrder.emails.map((email) => (
                      <article key={email.id}>
                        <div>
                          <strong>{emailKindLabels[email.kind]}</strong>
                          <span>
                            {email.orderStatus
                              ? `${orderStatusLabels[email.orderStatus]} · `
                              : ""}
                            {email.recipient || "Destinatar neconfigurat"}
                          </span>
                          {email.lastError && email.status !== "sent" && (
                            <small>{email.lastError}</small>
                          )}
                        </div>
                        <i className={`email-status email-status--${email.status}`}>
                          {emailStatusLabels[email.status]}
                        </i>
                        {(email.status === "failed" ||
                          email.status === "not_configured") && (
                          <button
                            type="button"
                            disabled={updatingId === `email:${email.id}`}
                            onClick={() =>
                              retryEmail(selectedOrder, email.id)
                            }
                          >
                            {updatingId === `email:${email.id}`
                              ? "Se trimite…"
                              : "Încearcă din nou"}
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="admin-order-emails__empty">
                    Nu există încă emailuri pentru această comandă.
                  </p>
                )}
              </section>

              <section className="admin-order-products">
                <p>Produse</p>
                {selectedOrder.items.map((item) => (
                  <article key={item.id}>
                    <div>
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt=""
                          width={58}
                          height={68}
                          unoptimized
                        />
                      ) : (
                        <span>Fără foto</span>
                      )}
                    </div>
                    <p>
                      <strong>{item.productName}</strong>
                      <small>
                        {item.variantName
                          ? `Culoare: ${item.variantName} · `
                          : ""}
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </small>
                    </p>
                    <b>{formatPrice(item.lineTotal)}</b>
                  </article>
                ))}
              </section>

              <div className="admin-order-totals">
                <span>Subtotal <strong>{formatPrice(selectedOrder.subtotal)}</strong></span>
                <span>
                  {shippingMethodLabels[selectedOrder.shippingMethod]}{" "}
                  <strong>
                    {selectedOrder.shipping
                      ? formatPrice(selectedOrder.shipping)
                      : "Gratuită"}
                  </strong>
                </span>
                <span>Total <strong>{formatPrice(selectedOrder.total)}</strong></span>
              </div>
            </div>
            <footer>
              <button onClick={() => setSelectedOrder(null)}>Închide</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
