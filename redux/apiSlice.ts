import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ClientDashboardDto,
  CreateVisitDto,
  LoginRequestDto,
  LoginResponseDto,
  UpdateVisitDto,
  UserDto,
  VisitDto
} from "@gym/shared-types";
import { RootState } from "./store";

const API_URL = "http://localhost:4000";

export const gymApi = createApi({
  reducerPath: "gymApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token ?? localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    }
  }),
  tagTypes: ["CurrentUser", "Clients", "Dashboard", "Visits"],
  keepUnusedDataFor: 300,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponseDto, LoginRequestDto>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      })
    }),
    me: builder.query<UserDto, void>({
      query: () => "/users/me",
      providesTags: ["CurrentUser"]
    }),
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
      invalidatesTags: (_result, _error, body) => [{ type: "Dashboard", id: body.userId }, "Visits"]
    }),
    updateVisit: builder.mutation<VisitDto, { id: number; body: UpdateVisitDto }>({
      query: ({ id, body }) => ({
        url: `/visits/${id}`,
        method: "PUT",
        body
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Dashboard", id: result.userId }, "Visits"] : ["Visits"]
    }),
    deleteVisit: builder.mutation<void, { id: number; userId: number }>({
      query: ({ id }) => ({
        url: `/visits/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Dashboard", id: arg.userId }, "Visits"]
    })
  })
});

export const {
  useClientsQuery,
  useCreateVisitMutation,
  useDashboardQuery,
  useDeleteVisitMutation,
  useLazyDashboardQuery,
  useLoginMutation,
  useMeQuery,
  useUpdateVisitMutation
} = gymApi;
