import { jest } from '@jest/globals';

const mockUserModel = {
  findAll: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
  findByEmail: jest.fn(),
  comparePassword: jest.fn(),
  updatePassword: jest.fn()
};

const mockValidator = {
  validateUpdateProfile: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.unstable_mockModule('../../src/models/userModel.js', () => ({
  __esModule: true,
  default: mockUserModel
}));

jest.unstable_mockModule('../../src/validators/authValidatorNew.js', () => ({
  __esModule: true,
  validateUpdateProfile: mockValidator.validateUpdateProfile
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger
}));

let getAllUsers;
let getUserById;
let updateUser;
let deleteUser;
let getMe;
let updateMe;
let changePassword;

beforeAll(async () => {
  const controller = await import('../../src/controllers/userController.js');
  getAllUsers = controller.getAllUsers;
  getUserById = controller.getUserById;
  updateUser = controller.updateUser;
  deleteUser = controller.deleteUser;
  getMe = controller.getMe;
  updateMe = controller.updateMe;
  changePassword = controller.changePassword;
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (overrides = {}) => ({
  user: { id: 'admin', role: 'admin', email: 'admin@neo.com' },
  query: {},
  params: {},
  body: {},
  ip: '127.0.0.1',
  ...overrides
});

describe('userController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
  const req = buildReq({ query: { page: '1', limit: '10' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.findAll.mockResolvedValueOnce([{ id: 'u1' }]);
      mockUserModel.count.mockResolvedValueOnce(1);

      await getAllUsers(req, res, next);

      expect(mockUserModel.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(mockUserModel.count).toHaveBeenCalledWith({ role: undefined, isActive: undefined });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ users: expect.any(Array) })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors to next', async () => {
      const error = new Error('DB error');
      mockUserModel.findAll.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await getAllUsers(buildReq(), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserById', () => {
    it('should respond with user when found', async () => {
  const req = buildReq({ params: { id: 'user-1' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.findById.mockResolvedValueOnce({ id: 'user-1' });

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: { user: { id: 'user-1' } }
      }));
    });

    it('should return 404 when user missing', async () => {
  const req = buildReq({ params: { id: 'missing' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.findById.mockResolvedValueOnce(null);

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward thrown errors', async () => {
      const error = new Error('lookup failed');
      mockUserModel.findById.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await getUserById(buildReq({ params: { id: 'user-err' } }), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
  const req = buildReq({ params: { id: 'user-1' }, body: { name: 'Neo' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.update.mockResolvedValueOnce({ id: 'user-1', name: 'Neo' });

      await updateUser(req, res, next);

      expect(mockUserModel.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'Neo' }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('should respond 404 when update returns null', async () => {
  const req = buildReq({ params: { id: 'missing' }, body: { name: 'Neo' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.update.mockResolvedValueOnce(null);

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should forward errors on update failure', async () => {
      const error = new Error('update broke');
      mockUserModel.update.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await updateUser(buildReq({ params: { id: 'user-err' }, body: {} }), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUser', () => {
    it('should respond 204 when delete succeeds', async () => {
  const req = buildReq({ params: { id: 'user-2' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.deleteById.mockResolvedValueOnce(true);

      await deleteUser(req, res, next);

      expect(mockUserModel.deleteById).toHaveBeenCalledWith('user-2');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 when nothing deleted', async () => {
  const req = buildReq({ params: { id: 'missing' } });
      const res = createRes();
      const next = jest.fn();
      mockUserModel.deleteById.mockResolvedValueOnce(false);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should forward errors on delete exception', async () => {
      const error = new Error('delete failed');
      mockUserModel.deleteById.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await deleteUser(buildReq({ params: { id: 'user-err' } }), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMe', () => {
    it('should return authenticated user data', async () => {
      const res = createRes();
      const next = jest.fn();
      mockUserModel.findById.mockResolvedValueOnce({ id: 'admin' });

  await getMe(buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { user: { id: 'admin' } }
      }));
    });

    it('should respond 404 when user missing', async () => {
      const res = createRes();
      const next = jest.fn();
      mockUserModel.findById.mockResolvedValueOnce(null);

  await getMe(buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should forward errors from model', async () => {
      const error = new Error('db down');
      mockUserModel.findById.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await getMe(buildReq(), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateMe', () => {
    it('should respond 404 when user not found', async () => {
      mockUserModel.update.mockResolvedValueOnce(null);
      const res = createRes();
      const next = jest.fn();

      await updateMe(buildReq({ body: { name: 'New Name' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should update profile when validation passes', async () => {
      mockUserModel.update.mockResolvedValueOnce({ id: 'admin', name: 'Neo' });
      const res = createRes();
      const next = jest.fn();

      await updateMe(buildReq({ body: { name: 'Neo' } }), res, next);

      expect(mockUserModel.update).toHaveBeenCalledWith('admin', { name: 'Neo' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('should return 404 when updateMe finds no user', async () => {
      mockValidator.validateUpdateProfile.mockReturnValueOnce({ error: null, value: { name: 'Neo' } });
      mockUserModel.update.mockResolvedValueOnce(null);
      const res = createRes();
      const next = jest.fn();

  await updateMe(buildReq({ body: { name: 'Neo' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should forward errors thrown during update', async () => {
      const error = new Error('update blew up');
      mockValidator.validateUpdateProfile.mockReturnValueOnce({ error: null, value: {} });
      mockUserModel.update.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await updateMe(buildReq(), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    it('should return 400 when fields missing', async () => {
      const res = createRes();
      const next = jest.fn();

  await changePassword(buildReq({ body: { newPassword: 'Secret123' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should return 400 when new password is too short', async () => {
      const res = createRes();
      const next = jest.fn();

  await changePassword(buildReq({ body: { currentPassword: 'old', newPassword: 'short' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should return 401 when current password invalid', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce({ password: 'HASH' });
      mockUserModel.comparePassword.mockResolvedValueOnce(false);
      const res = createRes();
      const next = jest.fn();

  await changePassword(buildReq({ body: { currentPassword: 'wrongpass', newPassword: 'NewPass123' } }), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
    });

    it('should update password when credentials valid', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce({ password: 'HASH' });
      mockUserModel.comparePassword.mockResolvedValueOnce(true);
      mockUserModel.updatePassword.mockResolvedValueOnce(true);
      const res = createRes();
      const next = jest.fn();

  await changePassword(buildReq({ body: { currentPassword: 'oldPassword', newPassword: 'NewPass123' } }), res, next);

      expect(mockUserModel.updatePassword).toHaveBeenCalledWith('admin', 'NewPass123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward unexpected errors', async () => {
      const error = new Error('password reset failed');
      mockUserModel.findByEmail.mockRejectedValueOnce(error);
      const res = createRes();
      const next = jest.fn();

  await changePassword(buildReq({ body: { currentPassword: 'oldPassword', newPassword: 'NewPass123' } }), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
