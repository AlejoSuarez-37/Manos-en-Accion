import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class AdminPolicy {
  manageEditors(user: User | null): boolean {
    return user?.role === 'admin';
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
