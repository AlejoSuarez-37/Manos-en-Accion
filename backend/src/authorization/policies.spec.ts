import { AdminPolicy } from './admin.policy.js';
import { ContentPolicy } from './content.policy.js';
import type { User } from '../users/user.js';

const admin: User = {
  id: 'admin-id',
  email: 'admin@manosenaccion.org',
  name: 'Admin',
  role: 'admin',
  createdAt: new Date(),
};

const editor: User = {
  id: 'editor-id',
  email: 'editor@manosenaccion.org',
  name: 'Editor',
  role: 'editor',
  createdAt: new Date(),
};

describe('ContentPolicy', () => {
  const policy = new ContentPolicy();

  it('allows admins and editors', () => {
    expect(policy.manage(admin)).toBe(true);
    expect(policy.manage(editor)).toBe(true);
  });

  it('denies guests', () => {
    expect(policy.manage(null)).toBe(false);
  });
});

describe('AdminPolicy', () => {
  const policy = new AdminPolicy();

  it('allows admins to manage editors and financial settings', () => {
    expect(policy.manageEditors(admin)).toBe(true);
    expect(policy.manageDonationCredentials(admin)).toBe(true);
    expect(policy.manageContactEmails(admin)).toBe(true);
    expect(policy.manageSiteSettings(admin)).toBe(true);
  });

  it('denies editors and guests', () => {
    expect(policy.manageEditors(editor)).toBe(false);
    expect(policy.manageDonationCredentials(editor)).toBe(false);
    expect(policy.manageContactEmails(editor)).toBe(false);
    expect(policy.manageSiteSettings(editor)).toBe(false);
    expect(policy.manageEditors(null)).toBe(false);
  });
});
