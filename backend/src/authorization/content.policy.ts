import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class ContentPolicy {
  manage(user: User | null): boolean {
    return user?.role === 'admin' || user?.role === 'editor';
  }
}
