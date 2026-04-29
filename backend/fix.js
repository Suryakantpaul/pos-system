const fs = require('fs');

const method = 'post';

const content = [
  'import { Router } from "express";',
  'import { signup, login, getMe } from "../controllers/authController";',
  'import { protect } from "../middleware/authMiddleware";',
  '',
  'const router = Router();',
  '',
  `router.${method}("/signup", signup);`,
  `router.${method}("/login", login);`,
  'router.get("/me", protect, getMe);',
  '',
  'export default router;',
  ''
].join('\n');

fs.writeFileSync('src/routes/authRoutes.ts', content, {encoding: 'utf8'});
console.log('Done!');
console.log(fs.readFileSync('src/routes/authRoutes.ts', 'utf8'));