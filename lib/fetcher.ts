import { AxiosRequestConfig } from "axios";
import api from "./axios";

function fetcher(url: string, options?: AxiosRequestConfig) {
  return api.get(url, options).then((res) => res.data);
}

export { fetcher };
