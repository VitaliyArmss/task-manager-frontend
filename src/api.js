const API_ROOT = "https://api.vitaliy-armss.ru/task-manager/api";
const API_URL = `${API_ROOT}/tasks`;
const TOKEN_KEY = "task_manager_token";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(url, options = {}, withAuth = true) {
  const token = authStorage.getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.title || message;
    } catch {
      // ignore non-JSON error bodies
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

async function authRequest(path, body) {
  const result = await request(`${API_ROOT}/auth/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  }, false);
  authStorage.setToken(result.token);
  return result;
}

export const api = {
  login: (login, password) => authRequest("login", { login, password }),
  me: () => request(`${API_ROOT}/auth/me`),

  getTasks: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "all") search.set(key, value);
    });
    const query = search.toString();
    return request(`${API_URL}${query ? `?${query}` : ""}`);
  },
  getStats: () => request(`${API_URL}/stats`),
  createTask: (task) => request(API_URL, { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id, task) => request(`${API_URL}/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  toggleTask: (id) => request(`${API_URL}/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`${API_URL}/${id}`, { method: "DELETE" }),
  deleteCompleted: () => request(`${API_URL}/completed`, { method: "DELETE" }),
};
