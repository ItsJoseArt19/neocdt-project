import { jest } from '@jest/globals';
import { adminOnly } from '../../src/middlewares/adminMiddleware.js';

describe('adminMiddleware', () => {
  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('should reject request without authenticated user', () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fail'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request when user lacks admin role', () => {
    const req = { user: { id: 'user-1', role: 'user' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fail'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when user is admin', () => {
    const req = { user: { id: 'admin-1', role: 'admin' } };
    const res = createRes();
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
