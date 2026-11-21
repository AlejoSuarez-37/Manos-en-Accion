import { AdminPolicy } from './admin.policy.js';
import { ContentPolicy } from './content.policy.js';
import type { User } from '../users/user.js';

const admin: User = {
  id: 'admin-id',
  email: 'admin@manosenaccion.org',
  name: 'Admin',
  role: 'admin',
};

const editor: User = {
  id: 'editor-id',
  email: 'editor@manosenaccion.org',
  name: 'Editor',
  role: 'editor',
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

  it('allows an admin to manage a different editor', () => {
    expect(policy.manageEditor(admin, editor)).toBe(true);
  });

  it('denies managing admins, self, editors and guests', () => {
    const otherAdmin: User = {
      id: 'other-admin-id',
      email: 'other-admin@manosenaccion.org',
      name: 'Other Admin',
      role: 'admin',
    };

    expect(policy.manageEditor(admin, otherAdmin)).toBe(false);
    expect(policy.manageEditor(admin, admin)).toBe(false);
    expect(policy.manageEditor(editor, admin)).toBe(false);
    expect(policy.manageEditor(null, editor)).toBe(false);
  });

  it('denies editors and guests', () => {
    expect(policy.manageEditors(editor)).toBe(false);
    expect(policy.manageDonationCredentials(editor)).toBe(false);
    expect(policy.manageContactEmails(editor)).toBe(false);
    expect(policy.manageSiteSettings(editor)).toBe(false);
    expect(policy.manageEditors(null)).toBe(false);
  });
});
