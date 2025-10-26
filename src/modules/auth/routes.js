import { Router } from 'express';
import { register, login, registerWithInvite } from './usecases.js';
import { body } from 'express-validator';
import inviteCodesRoutes from './inviteCodes.routes.js';
import adminRouter from './admin.routes.js';

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

r.post('/register-with-invite',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('inviteCode').isLength({ min: 1 }),
  registerWithInvite
);

r.use('/invite-codes', inviteCodesRoutes);
r.use('/admin', adminRouter);

export default r;