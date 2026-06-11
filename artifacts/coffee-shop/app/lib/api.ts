const BASE_URL = "https://coffee-manage.onrender.com/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "API Error");
  }

  return data;
}

export const api = {
  // MENU
  getMenu: () => request("/menu"),

  // ORDERS
  getOrders: () => request("/orders"),
  createOrder: (body: any) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOrder: (id: string, body: any) =>
    request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // TABLES
  getTables: () => request("/tables"),
  updateTable: (id: string, body: any) =>
    request(`/tables/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};