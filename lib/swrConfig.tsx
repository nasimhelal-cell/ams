"use client";
import { SWRConfig, SWRConfiguration } from "swr";
import { fetcher } from "./fetcher";

export const swrConfig: SWRConfiguration = {
  fetcher: fetcher,
  revalidateOnFocus: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};

const ConfigureSWR = ({ children }: { children: React.ReactNode }) => {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
};

export default ConfigureSWR;
