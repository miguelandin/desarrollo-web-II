import { Router } from 'express';
import * as uc from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadLogo } from '../middleware/upload.js';
import * as schemas from '../validators/user.validator.js';

const router = Router();

// Públicas
router.post('/register', validate(schemas.registerSchema), uc.register);
router.post('/login', validate(schemas.loginSchema), uc.login);
router.post('/refresh', uc.refreshToken);

// Privadas (Requieren Token)
router.use(verifyToken);

router.put('/validation', validate(schemas.validationSchema), uc.validateEmail);
router.put('/register', validate(schemas.personalDataSchema), uc.updatePersonalData); // Onboarding Personal
router.patch('/company', validate(schemas.companySchema), uc.updateCompany); // Onboarding Company
router.patch('/logo', uploadLogo.single('logo'), uc.uploadCompanyLogo);
router.get('/', uc.getUserProfile);
router.post('/logout', uc.logout);
router.delete('/', uc.deleteUser);
router.put('/password', validate(schemas.passwordSchema), uc.changePassword);

// Solo Admin
router.post('/invite', requireRole('admin'), validate(schemas.inviteSchema), uc.inviteUser);

export default router;
