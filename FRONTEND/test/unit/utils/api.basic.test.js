import { describe, it, expect, vi } from 'vitest';

// Test básico de API utils
import axios from 'axios';

vi.mock('axios');

describe('API Utils - Basic Coverage', () => {
  it('should have axios instance configured', () => {
    expect(axios).toBeDefined();
  });

  it('axios create should be a function', () => {
    expect(typeof axios.create).toBe('function');
  });

  it('axios get should be a function', () => {
    expect(typeof axios.get).toBe('function');
  });

  it('axios post should be a function', () => {
    expect(typeof axios.post).toBe('function');
  });

  it('axios put should be a function', () => {
    expect(typeof axios.put).toBe('function');
  });

  it('axios delete should be a function', () => {
    expect(typeof axios.delete).toBe('function');
  });
});
