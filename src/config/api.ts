import axiosLib from "axios";

export const apiBaseURL =
  import.meta.env.MODE === "production"
    ? "https://api.fiyatgor.panunet.com.tr"
    : "http://localhost:3000";

export const axios = axiosLib.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});
