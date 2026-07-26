import axios from "axios";

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Separate Axios client used only for token refresh.
 * It intentionally does not share api's interceptors.
 */
const refreshApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

/*
|--------------------------------------------------------------------------
| Request interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") {
      return config;
    }

    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
|--------------------------------------------------------------------------
| Response interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    /*
     * Only attempt refresh for a single failed authenticated request.
     */
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      clearStoredAuthentication();
      redirectToLogin();

      return Promise.reject(error);
    }

    try {
      /*
       * Reuse the same refresh operation if several requests
       * receive 401 responses at the same time.
       */
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(refreshToken).finally(() => {
          refreshPromise = null;
        });
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await refreshPromise;

      localStorage.setItem("accessToken", newAccessToken);

      localStorage.setItem("refreshToken", newRefreshToken);

      originalRequest.headers = originalRequest.headers || {};

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAuthentication();
      redirectToLogin();

      return Promise.reject(refreshError);
    }
  },
);

/*
|--------------------------------------------------------------------------
| Refresh access token
|--------------------------------------------------------------------------
*/

async function refreshAccessToken(refreshToken) {
  const response = await refreshApi.post("/auth/refresh", {
    refreshToken,
  });

  const newAccessToken = response.data?.accessToken;

  const newRefreshToken = response.data?.refreshToken;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("Refresh response did not contain valid tokens");
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/*
|--------------------------------------------------------------------------
| Authentication cleanup
|--------------------------------------------------------------------------
*/

function clearStoredAuthentication() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname === "/login") {
    return;
  }

  window.location.replace("/login");
}

export default api;
