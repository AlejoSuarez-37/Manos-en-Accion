import { Policy } from '@nestjs/authorization';
import type { User } from '../users/entities/user.entity.js';

@Policy()
export class ContentPolicy {
  manage(user: User | null): boolean {
    return user?.role === 'admin' || user?.role === 'editor';
  }
}
