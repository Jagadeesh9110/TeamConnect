const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Login failed");
    }
    return data;
}

export const registerUser = async (
    name: string,
    email: string,
    password: string
) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Registration failed");
    }

    return data;
};