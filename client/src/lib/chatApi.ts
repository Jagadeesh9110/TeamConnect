const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Helper to get auth headers
 * (Later this can be removed when switching to httpOnly cookies)
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        throw new Error("Authentication token missing");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};


// fetch conversations
export const fetchConversations = async () => {
    const res = await fetch(`${API_BASE}/conversations`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to fetch conversations");
    }

    return res.json();
}

// fetch messages
export const fetchMessages = async (conversationId: string) => {
    const res = await fetch(`${API_BASE}/messages/${conversationId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Failed to fetch messages");
    }

    return res.json();
}

// send message

export const sendMessage = async (conversationId: string, message: string) => {
    const res = await fetch(`${API_BASE}/messages/${conversationId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content:message }),
    });

    if (!res.ok) {
        throw new Error("Failed to send message");
    }

    return res.json();
}