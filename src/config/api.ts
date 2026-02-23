import axiosLib from "axios";

export const axios = axiosLib.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? "https://api.fiyatgor.panunet.com.tr"
      : "http://localhost:3000",
  withCredentials: true,
});
