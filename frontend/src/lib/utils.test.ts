import { describe, test, expect } from 'vitest';
import { formatCurrency, formatRelativeTime, formatDate, cn, debounce } from '../lib/utils';

describe('utils', () => {
  describe('formatCurrency', () => {
    test('formats USD correctly', () => {
      expect(formatCurrency(150000, 'USD')).toBe('$150,000');
    });

    test('formats EUR correctly', () => {
      expect(formatCurrency(100000, 'EUR')).toBe('€100,000');
    });

    test('handles zero', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0');
    });

    test('handles large numbers', () => {
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
    });
  });

  describe('formatRelativeTime', () => {
    test('shows "Just now" for recent times', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('Just now');
    });

    test('shows minutes ago', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');
    });

    test('shows hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    test('shows days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    test('shows formatted date for older times', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(tenDaysAgo);
      expect(result).toMatch(/\w{3} \d{1,2}, \d{4}/);
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      expect(formatDate(date)).toMatch(/Jan 15, 2024/);
    });
  });

  describe('cn', () => {
    test('merges class names', () => {
      expect(cn('base', 'override')).toBe('base override');
    });

    test('handles conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    test('handles tailwind merge', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('debounce', () => {
    test('delays function execution', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1');
      debounced('arg2');
      debounced('arg3');

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg3');
    });

    test('clears previous timeout', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      await new Promise(resolve => setTimeout(resolve, 50));
      debounced('second');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });
  });
});