import { api } from "./client";


export async function createOrder(payload, token) {
// POST /orders/ — adjust to your actual endpoint
return api("/orders/", { method: "POST", body: payload, token });
}

export async function register(payload,token){
    return api("/user/", { method: "POST", body: payload, token });
}