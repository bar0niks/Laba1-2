import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ClientDashboardDto, CreateVisitDto, UpdateVisitDto, UserDto, VisitDto } from "@gym/shared-types";
import { getToken } from "@gym/frontend-common";

export const clientsApi = createApi({
  reducerPath: "clientsApi",
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
  tagTypes: ["Clients", "Dashboard"],
  endpoints: (builder) => ({
    clients: builder.query<UserDto[], void>({
      query: () => "/clients",
      providesTags: ["Clients"]
    }),
    dashboard: builder.query<ClientDashboardDto, number>({
      query: (id) => `/clients/${id}/dashboard`,
      providesTags: (_result, _error, id) => [{ type: "Dashboard", id }]
    }),
    createVisit: builder.mutation<VisitDto, CreateVisitDto>({
      query: (body) => ({
        url: "/visits",
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, body) => [{ type: "Dashboard", id: body.userId }]
    }),
    updateVisit: builder.mutation<VisitDto, { id: number; body: UpdateVisitDto }>({
      query: ({ id, body }) => ({
        url: `/visits/${id}`,
        method: "PUT",
        body
      }),
      invalidatesTags: (result) => result ? [{ type: "Dashboard", id: result.userId }] : []
    }),
    deleteVisit: builder.mutation<void, { id: number; userId: number }>({
      query: ({ id }) => ({
        url: `/visits/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Dashboard", id: arg.userId }]
    })
  })
});

export const {
  useClientsQuery,
  useCreateVisitMutation,
  useDeleteVisitMutation,
  useLazyDashboardQuery,
  useUpdateVisitMutation
} = clientsApi;
