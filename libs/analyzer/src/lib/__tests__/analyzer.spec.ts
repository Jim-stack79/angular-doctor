import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeProject } from '../analyzer';
import type { Issue } from '../types';

vi.mock('../file-reader', () => ({
    createProject: vi.fn(),
    getAngularSourceFiles: vi.fn(),
}));