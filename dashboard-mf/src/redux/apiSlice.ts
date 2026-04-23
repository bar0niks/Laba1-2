import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ClientDashboardDto, UserDto } from "@gym/shared-types";
import { getToken } from "@gym/frontend-common";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000",
    prepareHeaders: (headers) => {
      const token = getToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    }
  }),
  endpoints: (builder) => ({
    clients: builder.query<UserDto[], void>({
      query: () => "/clients"
    }),
    dashboard: builder.query<ClientDashboardDto, number>({
      query: (id) => `/clients/${id}/dashboard`
    })
  })
});

export const { useClientsQuery, useDashboardQuery, useLazyDashboardQuery } = dashboardApi;
