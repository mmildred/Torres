import { Router } from 'express';
import { register, login } from './usecases.js';
import { body } from 'express-validator';

const r = Router();

r.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  register
);

r.post('/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  login
);

export default r;
