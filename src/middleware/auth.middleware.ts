import { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/security';
import { User, IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  try {
    const token = authHeader.substring(7);
    const payload = decodeToken(token, 'access');
    const userId = payload.sub;

    if (!userId) {
      return res.status(401).json({
        detail: 'Could not validate credentials',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        detail: 'Could not validate credentials',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        detail: 'Could not validate credentials',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        detail: 'Insufficient permissions',
      });
    }

    next();
  };
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({
      detail: 'Insufficient permissions',
    });
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      detail: 'Could not validate credentials',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      detail: 'Insufficient permissions',
    });
  }

  next();
}
