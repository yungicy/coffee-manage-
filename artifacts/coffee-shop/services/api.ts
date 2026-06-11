const BASE_URL = "https://coffee-manage.onrender.com/api";

export const api = {
  getMenu: async () => {
    const res = await fetch(`${BASE_URL}/menu`);
    return res.json();
  },

  getOrders: async () => {
    const res = await fetch(`${BASE_URL}/orders`);
    return res.json();
  },

  createOrder: async (order) => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    return res.json();
  },

  getTables: async () => {
    const res = await fetch(`${BASE_URL}/tables`);
    return res.json();
  },
};