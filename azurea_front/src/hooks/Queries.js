import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AubergeAPI, RoomsAPI, ServicesAPI, ReservationsAPI,
  InvoicesAPI, UsersAPI, ProfileAPI, apiGetAll,
} from "../services/api";
import { getStoredUser } from "../services/auth";
import {
  list, one, toRoom, toService, toAuberge,
  toReservation, toInvoice, toUser,
} from "../lib/Normalize";

/* ───────── LECTURES (useQuery) ───────── */

export const useAuberge = () =>
  useQuery({
    queryKey: ["auberge"],
    queryFn: async () => toAuberge(one(await AubergeAPI.get())),
    staleTime: 5 * 60 * 1000,
  });

export const useRooms = () =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await apiGetAll("/chambres")).map(toRoom),
  });

export const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: async () => (await apiGetAll("/services")).map(toService),
  });

// ids des chambres libres entre 2 dates
export const useAvailableRoomIds = (from, to, adults, children, enabled) =>
  useQuery({
    queryKey: ["rooms", "available", from, to, adults, children],
    enabled: Boolean(enabled),
    queryFn: async () =>
      list(await RoomsAPI.available({
        date_debut: from,
        date_fin: to,
        nombre_adultes: adults,
        nombre_enfants: children,
      }), "chambres").map((r) => String(r.id)),
  });

export const useReservationDetail = (id, role, enabled) =>
  useQuery({
    queryKey: ["reservation-detail", role, id],
    enabled: Boolean(enabled && id && role),
    queryFn: async () => {
      const response = role === "CLIENT"
        ? await ReservationsAPI.mineById(id)
        : await ReservationsAPI.byId(id);
      return toReservation(response?.reservation ?? response);
    },
  });

/**
 * Même forme que l'ancien read() du mock :
 * { rooms, services, auberge, reservations, invoices, payments, users }
 * → les pages existantes continuent de marcher. Selon le rôle de la session :
 *   CLIENT → /me/reservations + /me/factures
 *   RECEPTIONNISTE → /reservations + /factures
 *   ADMIN → + /administration/AllUsers
 */
export function useData() {
  const me = getStoredUser();
  const role = me?.role ? String(me.role).toUpperCase() : null;
  const uid = me?.id ?? null;

  const rooms = useRooms();
  const services = useServices();
  const auberge = useAuberge();

  const reservationsQ = useQuery({
    queryKey: ["reservations", role, uid],
    enabled: Boolean(role),
    retry: false,
    queryFn: async () =>
      (role === "CLIENT"
        ? await apiGetAll("/me/reservations", "reservations")
        : await apiGetAll(
            role === "ADMIN" ? "/administration/reservations" : "/reservations",
            "reservation",
          )
      ).map(toReservation),
  });

  const invoicesQ = useQuery({
    queryKey: ["invoices", role, uid],
    enabled: Boolean(role),
    retry: false,
    queryFn: async () =>
      (role === "CLIENT"
        ? await apiGetAll("/me/factures", "factures")
        : await apiGetAll(
            role === "ADMIN" ? "/administration/factures" : "/factures",
            "factures",
          )
      ).map(toInvoice),
  });

  const usersQ = useQuery({
    queryKey: ["users"],
    enabled: role === "ADMIN",
    retry: false,
    queryFn: async () => (await apiGetAll("/administration/AllUsers")).map(toUser),
  });

  const roomsList = rooms.data;
  const reservations = useMemo(
    () =>
      (reservationsQ.data ?? []).map((b) => {
        const chambre = b.chambre ?? roomsList?.find((r) => r.id === b.chambreId) ?? null;
        const client = b.client ?? (role === "CLIENT" ? me : null);
        return { ...b, chambre, client };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reservationsQ.data, roomsList, role],
  );

  const invoices = invoicesQ.data;
  const payments = useMemo(
    () => (invoices ?? []).flatMap((i) => (i.paiements ?? []).map((p) => ({ ...p, factureId: i.id }))),
    [invoices],
  );

  return {
    rooms: rooms.data ?? [],
    services: services.data ?? [],
    auberge: auberge.data ?? {},
    reservations,
    invoices: invoices ?? [],
    payments,
    users: usersQ.data ?? [],
    isLoading:
      rooms.isLoading ||
      services.isLoading ||
      auberge.isLoading ||
      (Boolean(role) && (reservationsQ.isLoading || invoicesQ.isLoading)) ||
      (role === "ADMIN" && usersQ.isLoading),
    error:
      rooms.error ||
      services.error ||
      auberge.error ||
      reservationsQ.error ||
      invoicesQ.error ||
      usersQ.error ||
      null,
  };
}

/* ───────── ACTIONS (useMutation) ───────── */

export function useActions() {
  const qc = useQueryClient();
  // après une action, on dit à React Query de recharger ces listes
  const refresh = (...keys) => () =>
    Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));

  return {
    // chambres (réception)
    createRoom: useMutation({ mutationFn: (body) => RoomsAPI.create(body), onSuccess: refresh("rooms") }),
    updateRoom: useMutation({ mutationFn: ({ id, body }) => RoomsAPI.update(id, body), onSuccess: refresh("rooms") }),
    setRoomStatus: useMutation({ mutationFn: ({ id, body }) => RoomsAPI.setStatus(id, body), onSuccess: refresh("rooms") }),
    deleteRoom: useMutation({ mutationFn: (id) => RoomsAPI.remove(id), onSuccess: refresh("rooms") }),

    // services (réception)
    createService: useMutation({ mutationFn: (body) => ServicesAPI.create(body), onSuccess: refresh("services") }),
    updateService: useMutation({ mutationFn: ({ id, body }) => ServicesAPI.update(id, body), onSuccess: refresh("services") }),
    deleteService: useMutation({ mutationFn: (id) => ServicesAPI.remove(id), onSuccess: refresh("services") }),
    createReceptionniste: useMutation({
      mutationFn: (body) => UsersAPI.createReceptionniste(body),
      onSuccess: refresh("users"),
    }),
    removeReceptionniste: useMutation({
      mutationFn: (body) => UsersAPI.removeReceptionniste(body),
      onSuccess: refresh("users"),
    }),

    // réservations
    createReservation: useMutation({
      mutationFn: ({ chambreId, body }) => ReservationsAPI.create(chambreId, body),
      onSuccess: refresh("reservations", "invoices", "rooms"),
    }),
    addReservationService: useMutation({
      mutationFn: ({ id, body }) => ReservationsAPI.addService(id, body),
      onSuccess: refresh("reservations", "invoices", "reservation-detail"),
    }),
    cancelReservation: useMutation({
      mutationFn: (id) => ReservationsAPI.cancel(id),
      onSuccess: refresh("reservations", "invoices", "rooms", "reservation-detail"),
    }),
    checkIn: useMutation({
      mutationFn: (id) => ReservationsAPI.checkIn(id),
      onSuccess: refresh("reservations", "rooms", "reservation-detail"),
    }),
    checkOut: useMutation({
      mutationFn: (id) => ReservationsAPI.checkOut(id),
      onSuccess: refresh("reservations", "rooms", "invoices", "reservation-detail"),
    }),

    // paiement espèces
    payInvoice: useMutation({
      mutationFn: ({ id, body }) => InvoicesAPI.pay(id, body),
      onSuccess: refresh("invoices", "reservations"),
    }),
    resendPaymentConfirmation: useMutation({
      mutationFn: (id) => InvoicesAPI.resendConfirmation(id),
    }),

    // admin
    updateAuberge: useMutation({ mutationFn: ({ id, body }) => AubergeAPI.update(id, body), onSuccess: refresh("auberge") }),

    // profil
    updateProfile: useMutation({ mutationFn: (body) => ProfileAPI.update(body) }),
    changePassword: useMutation({ mutationFn: (body) => ProfileAPI.changePassword(body) }),
  };
}