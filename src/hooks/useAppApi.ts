import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AddContactInput, ConnectWhatsAppInput, CreateCampaignInput } from "@/lib/api";

export const appStateQueryKey = ["app-state"] as const;

export function useAppStateQuery() {
  return useQuery({
    queryKey: appStateQueryKey,
    queryFn: () => api.getAppState(),
    staleTime: Infinity,
  });
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.signIn(email, password),
    onSuccess: (state) => queryClient.setQueryData(appStateQueryKey, state),
  });
}

export function useSignUpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      api.signUp(name, email, password),
    onSuccess: (state) => queryClient.setQueryData(appStateQueryKey, state),
  });
}

export function useConnectWhatsAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectWhatsAppInput) => api.connectWhatsApp(input),
    onSuccess: (state) => queryClient.setQueryData(appStateQueryKey, state),
  });
}

export function useAddWalletFundsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, source }: { amount: number; source?: string }) => api.addWalletFunds(amount, source),
    onSuccess: ({ state }) => queryClient.setQueryData(appStateQueryKey, state),
  });
}

export function useAddContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddContactInput) => api.addContact(input),
    onSuccess: (state) => queryClient.setQueryData(appStateQueryKey, state),
  });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => api.createCampaign(input),
    onSuccess: ({ state }) => queryClient.setQueryData(appStateQueryKey, state),
  });
}
