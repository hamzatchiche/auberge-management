import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AubergeAPI, RoomsAPI, ServicesAPI, ReservationsAPI,
  InvoicesAPI, UsersAPI, ProfileAPI,
} from "../services/api";
import { getStoredUser } from "../services/auth";
import {
  list, one, toRoom, toService, toAuberge,
  toReservation, toInvoice, toUser,
} from "../lib/normalize";

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
    queryFn: async () => list(await RoomsAPI.list()).map(toRoom),
  });

export const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: async () => list(await ServicesAPI.list()).map(toService),
  });

// ids des chambres libres entre 2 dates
export const useAvailableRoomIds = (from, to, enabled) =>
  useQuery({
    queryKey: ["rooms", "available", from, to],
    enabled: Boolean(enabled),
    queryFn: async () =>
      list(await RoomsAPI.available({ date_debut: from, date_fin: to })).map((r) => r.id),
  });

/**
 * Même forme que l'ancien read() du mock :
 * { rooms, services, auberge, reservations, invoices, payments, users }
 * → les pages existantes continuent de marcher. Selon le rôle de la session :
 *   CLIENT → /me/reservations + /me/factures
 *   RECEPTIONNISTE / ADMIN → /reservations + /factures
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
      list(role === "CLIENT" ? await ReservationsAPI.mine() : await ReservationsAPI.all()).map(
        toReservation,
      ),
  });

  const invoicesQ = useQuery({
    queryKey: ["invoices", role, uid],
    enabled: Boolean(role),
    retry: false,
    queryFn: async () =>
      list(role === "CLIENT" ? await InvoicesAPI.mine() : await InvoicesAPI.all()).map(toInvoice),
  });

  const usersQ = useQuery({
    queryKey: ["users"],
    enabled: role === "ADMIN",
    retry: false,
    queryFn: async () => list(await UsersAPI.list()).map(toUser),
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
    () => (invoices ?? []).flatMap((i) => i.paiements.map((p) => ({ ...p, factureId: i.id }))),
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
    isLoading: rooms.isLoading || services.isLoading || auberge.isLoading,
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

    // réservations
    createReservation: useMutation({
      mutationFn: ({ chambreId, body }) => ReservationsAPI.create(chambreId, body),
      onSuccess: refresh("reservations", "invoices", "rooms"),
    }),
    cancelReservation: useMutation({
      mutationFn: (id) => ReservationsAPI.cancel(id),
      onSuccess: refresh("reservations", "invoices", "rooms"),
    }),
    checkIn: useMutation({ mutationFn: (id) => ReservationsAPI.checkIn(id), onSuccess: refresh("reservations", "rooms") }),
    checkOut: useMutation({ mutationFn: (id) => ReservationsAPI.checkOut(id), onSuccess: refresh("reservations", "rooms", "invoices") }),

    // paiement espèces
    payInvoice: useMutation({
      mutationFn: ({ id, body }) => InvoicesAPI.pay(id, body),
      onSuccess: refresh("invoices", "reservations"),
    }),

    // admin
    updateAuberge: useMutation({ mutationFn: ({ id, body }) => AubergeAPI.update(id, body), onSuccess: refresh("auberge") }),

    // profil
    updateProfile: useMutation({ mutationFn: (body) => ProfileAPI.update(body) }),
    changePassword: useMutation({ mutationFn: (body) => ProfileAPI.changePassword(body) }),
  };
}