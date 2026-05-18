import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

// Simple session-based authentication (for production, use JWT or session stores)
interface SessionData {
  userId?: string;
  role?: string;
  authenticated: boolean;
}

// In-memory session store (for production, use Redis or database)
const sessions = new Map<string, SessionData>();

// Generate session token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Auth middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // For now, allow all requests through
  // In production, implement proper JWT or session-based auth

  const token = req.headers['x-session-token'] as string;
  const sessionId = req.headers['x-session-id'] as string;

  if (token && sessionId) {
    const session = sessions.get(sessionId);
    if (session?.authenticated) {
      (req as any).session = session;
      (req as any).sessionId = sessionId;
    }
  }

  next();
}

// Login endpoint
export function login(req: Request, res: Response) {
  const { username, password } = req.body;

  // TODO: Replace with actual user authentication from database
  // This is a placeholder implementation
  if (username && password) {
    const sessionId = generateToken();
    const sessionData: SessionData = {
      userId: username,
      role: 'admin', // Default role for demo
      authenticated: true,
    };

    sessions.set(sessionId, sessionData);

    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      sessionId,
      token: generateToken(),
      user: {
        id: username,
        role: sessionData.role,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Kullanıcı adı ve şifre gerekli',
    });
  }
}

// Logout endpoint
export function logout(req: Request, res: Response) {
  const sessionId = req.headers['x-session-id'] as string;

  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    logger.info(`Session closed: ${sessionId}`);
    res.json({ success: true });
  } else {
    res.json({ success: true });
  }
}

// Check session
export function checkSession(req: Request, res: Response) {
  const sessionId = req.headers['x-session-id'] as string;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    res.json({
      authenticated: session?.authenticated || false,
      user: session?.authenticated ? { id: session?.userId, role: session?.role } : null,
    });
  } else {
    res.json({
      authenticated: false,
      user: null,
    });
  }
}

// Role check middleware
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;

    if (!session?.authenticated) {
      res.status(401).json({
        error: 'Giriş yapmanız gerekiyor',
      });
      return;
    }

    if (!roles.includes(session.role || '')) {
      res.status(403).json({
        error: 'Bu işlem için yetkiniz yok',
      });
      return;
    }

    next();
  };
}

// Export sessions for testing
export { sessions };