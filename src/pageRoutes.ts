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
  passwordCreation: {
    path: "/create-password",
  },
  signup: {
    path: "/signup",
  },
  lost: {
    path: "/*",
  },
} as const;
