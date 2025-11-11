import request from 'supertest';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';

describe('Express App', () => {
  it('should return welcome payload on root endpoint', async () => {
    const response = await request(app).get('/').expect(200);

    expect(response.body).toEqual(expect.objectContaining({
      status: 'success',
      message: 'Welcome to NEOCDT API',
      version: config.apiVersion
    }));
  });

  it('should expose health metrics', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual(expect.objectContaining({
      status: 'success',
      data: expect.objectContaining({
        uptime: expect.any(Object),
        memory: expect.any(Object),
        process: expect.objectContaining({ pid: expect.any(Number) })
      })
    }));
  });

  it('should provide CSRF token for clients', async () => {
    const response = await request(app)
      .get(`/api/${config.apiVersion}/csrf-token`)
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining({
      status: 'success',
      csrfToken: expect.any(String)
    }));
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
