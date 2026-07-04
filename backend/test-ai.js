

async function test() {
  // First, we need a valid auth token. But we can just mock a request to /api/auth/signup or login
  console.log("Testing AI generation...");
  try {
    // 1. Create a mock user to get a token
    const signup = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: `test_${Date.now()}@test.com`,
        password: "password123",
      })
    });
    const { token } = await signup.json();
    console.log("Got token:", token ? "Yes" : "No");

    // 2. Test generate endpoint
    const res = await fetch("http://localhost:5000/api/ai/generate", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `auth-token=${token}` // Express middleware reads from cookie or auth header
      },
      body: JSON.stringify({ prompt: "Say hello!" })
    });
    const data = await res.json();
    console.log("Response:", res.status, data);
  } catch(e) {
    console.error(e);
  }
}
test();
