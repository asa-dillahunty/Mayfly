export const pageRoutes = {
  login: {
    path: "/",
  },
  dashboard: {
    path: "/dashboard",
  },
  forgot: {
    path: "/forgot",
  },
  passwordReset: {
    path: "/password-reset",
  },
  signup: {
    path: "/signup",
  },
  lost: {
    path: "/*",
  },
} as const;
