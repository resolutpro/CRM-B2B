import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  next();
}

export function requireBearerToken(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.AGENT_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AGENT_API_KEY no configurada en el servidor" });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Bearer token requerido" });
    return;
  }
  const token = auth.slice(7);
  if (token !== apiKey) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  next();
}
