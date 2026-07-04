import { SignJWT, jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "auth-token";
const TOKEN_EXPIRY = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random 64-char string in .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

// Extend Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.email) return null;
    return {
      id: payload.sub,
      name: (payload.name as string) || "",
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Middleware to protect routes
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token = "";
    // Check cookies (if using cookie-parser)
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      const authCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    // Also check Authorization header as a fallback (useful for mobile apps)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[Auth Middleware]", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
}
