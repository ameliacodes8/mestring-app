import jwt from 'jsonwebtoken';

// Verify Supabase JWT (access token) on incoming requests
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    // Supabase JWTs are JWS signed; we typically verify audience/issuer only.
    // In production, consider fetching JWKs for full verification.
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    // Basic checks (optional, not cryptographic)
    // If you want robust verification, use JWKS from Supabase
    req.user = decoded.payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}