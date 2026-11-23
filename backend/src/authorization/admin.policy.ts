import { Policy } from '@nestjs/authorization';
import type { User } from '../users/entities/user.entity.js';

@Policy()
export class AdminPolicy {
  manageEditors(user: User | null): boolean {
    return user?.role === 'admin';
  }

  manageEditor(user: User | null, target: User): boolean {
    return (
      user?.role === 'admin' &&
      target.role === 'editor' &&
      target.id !== user.id
    );
  }

  manageDonationCredentials(user: User | null): boolean {
    return user?.role === 'admin';
  }

  manageContactEmails(user: User | null): boolean {
    return user?.role === 'admin';
  }

  manageSiteSettings(user: User | null): boolean {
    return user?.role === 'admin';
  }
}
