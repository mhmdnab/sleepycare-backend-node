import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.middleware';
import { getCurrentUser } from '../middleware/auth.middleware';
import {
  userCreateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/user.schema';
import {
  registerUser,
  authenticateUser,
  generateTokensForUser,
  createPasswordReset,
  resetPassword,
} from '../services/auth.service';

const router = Router();

// POST /auth/register
router.post('/register', validate(userCreateSchema), async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);
    const tokens = generateTokensForUser(user);
    return res.status(200).json(tokens);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.detail });
    }
    console.error('Register error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /auth/login (expects form data with username and password)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body; // username is actually email
    if (!username || !password) {
      return res.status(422).json({ detail: 'Missing username or password' });
    }
    const user = await authenticateUser(username, password);
    const tokens = generateTokensForUser(user);
    return res.status(200).json(tokens);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.detail });
    }
    console.error('Login error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /auth/google (disabled)
router.post('/google', async (req: Request, res: Response) => {
  return res.status(503).json({ detail: 'Google login disabled for now' });
});

// POST /auth/apple (disabled)
router.post('/apple', async (req: Request, res: Response) => {
  return res.status(503).json({ detail: 'Apple login disabled for now' });
});

// POST /auth/forgot-password
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      await createPasswordReset(req.body.email);
      return res.status(204).send();
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ detail: error.detail });
      }
      console.error('Forgot password error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

// POST /auth/reset-password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      await resetPassword(req.body.token, req.body.new_password);
      return res.status(204).send();
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ detail: error.detail });
      }
      console.error('Reset password error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

// GET /auth/me
router.get('/me', getCurrentUser, async (req: Request, res: Response) => {
  const user = req.user!;
  return res.status(200).json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    created_at: user.created_at.toISOString(),
  });
});

export default router;
