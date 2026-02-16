export async function logout() {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to log out");
    }

    return await res.json();
  } catch (error) {
    console.error("Error logging out:", error);
    return null;
  }
}
