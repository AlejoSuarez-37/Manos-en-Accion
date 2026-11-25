import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PasswordHasher, SessionService } from '@nestjs/authentication';
import { AuthorizationService } from '@nestjs/authorization';
import { QueryFailedError, type Repository } from 'typeorm';
import { AdminPolicy } from '../authorization/admin.policy.js';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

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

const createService = () => {
  const users = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  };
  const passwordHasher = { hash: vi.fn() };
  const sessions = { revokeAll: vi.fn() };
  const authorizationService = { authorize: vi.fn() };

  const service = new UsersService(
    users as unknown as Repository<User>,
    passwordHasher as unknown as PasswordHasher,
    sessions as unknown as SessionService,
    authorizationService as unknown as AuthorizationService,
  );

  return { service, users, passwordHasher, sessions, authorizationService };
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('UsersService', () => {
  it('lists all users', async () => {
    const { service, users } = createService();
    users.find.mockResolvedValue([admin, editor]);

    await expect(service.findAll()).resolves.toEqual([admin, editor]);
  });

  it('throws NotFoundException when the user does not exist', async () => {
    const { service, users } = createService();
    users.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('normalizes email, hashes password and always creates editors', async () => {
    const { service, users, passwordHasher } = createService();
    users.findOneBy.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');
    users.create.mockImplementation((value) => value);
    users.save.mockImplementation(async (value) => ({
      ...value,
      id: 'new-id',
    }));

    const result = await service.create({
      name: '  New Editor  ',
      email: ' NEW.Editor@Example.COM ',
      password: 'Password123',
    });

    expect(users.findOneBy).toHaveBeenCalledWith({
      email: 'new.editor@example.com',
    });
    expect(users.create).toHaveBeenCalledWith({
      email: 'new.editor@example.com',
      name: 'New Editor',
      role: 'editor',
      passwordHash: 'hashed-password',
    });
    expect(result).toEqual({
      id: 'new-id',
      email: 'new.editor@example.com',
      name: 'New Editor',
      role: 'editor',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email before hashing', async () => {
    const { service, users, passwordHasher } = createService();
    users.findOneBy.mockResolvedValue(editor);

    await expect(
      service.create({
        name: 'Other',
        email: editor.email,
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(passwordHasher.hash).not.toHaveBeenCalled();
  });

  it('maps a unique constraint race to ConflictException', async () => {
    const { service, users, passwordHasher } = createService();
    users.findOneBy.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');
    users.create.mockImplementation((value) => value);
    users.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('unique violation'), { code: '23505' }),
      ),
    );

    await expect(
      service.create({
        name: 'Other',
        email: 'other@example.com',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('authorizes before updating and revokes tokens after a password reset', async () => {
    const {
      service,
      users,
      passwordHasher,
      authorizationService,
      sessions,
    } = createService();
    const target: User = {
      id: editor.id,
      email: editor.email,
      name: editor.name,
      role: editor.role,
    };
    users.findOneBy.mockResolvedValue(target);
    authorizationService.authorize.mockResolvedValue(undefined);
    passwordHasher.hash.mockResolvedValue('new-hashed-password');
    users.save.mockImplementation(async (value) => value);

    const result = await service.update(admin, target.id, {
      name: '  Updated Editor  ',
      password: 'NewPassword123',
    });

    expect(authorizationService.authorize).toHaveBeenCalledWith(
      AdminPolicy,
      'manageEditor',
      admin,
      expect.objectContaining({ id: target.id, role: 'editor' }),
    );
    expect(result.name).toBe('Updated Editor');
    expect(result).not.toHaveProperty('passwordHash');
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: target.id,
        name: 'Updated Editor',
        passwordHash: 'new-hashed-password',
      }),
    );
    expect(sessions.revokeAll).toHaveBeenCalledWith(target.id);
  });

  it('does not update when authorization fails', async () => {
    const { service, users, authorizationService, sessions } =
      createService();
    users.findOneBy.mockResolvedValue(editor);
    authorizationService.authorize.mockRejectedValue(new ForbiddenException());

    await expect(
      service.update(admin, editor.id, { name: 'Hacked' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.save).not.toHaveBeenCalled();
    expect(sessions.revokeAll).not.toHaveBeenCalled();
  });

  it('does not revoke tokens when only the name changes', async () => {
    const { service, users, authorizationService, sessions } =
      createService();
    const target: User = {
      id: editor.id,
      email: editor.email,
      name: editor.name,
      role: editor.role,
    };
    users.findOneBy.mockResolvedValue(target);
    authorizationService.authorize.mockResolvedValue(undefined);
    users.save.mockImplementation(async (value) => value);

    await service.update(admin, target.id, { name: 'Renamed' });

    expect(sessions.revokeAll).not.toHaveBeenCalled();
  });

  it('authorizes before deleting and revokes tokens', async () => {
    const { service, users, authorizationService, sessions } =
      createService();
    users.findOneBy.mockResolvedValue(editor);
    authorizationService.authorize.mockResolvedValue(undefined);
    users.remove.mockResolvedValue(editor);

    await service.remove(admin, editor.id);

    expect(authorizationService.authorize).toHaveBeenCalledWith(
      AdminPolicy,
      'manageEditor',
      admin,
      editor,
    );
    expect(users.remove).toHaveBeenCalledWith(editor);
    expect(sessions.revokeAll).toHaveBeenCalledWith(editor.id);
  });

  it('generates a temporary password, authorizes and revokes all sessions', async () => {
    const { service, users, passwordHasher, authorizationService, sessions } =
      createService();
    users.findOneBy.mockResolvedValue(editor);
    authorizationService.authorize.mockResolvedValue(undefined);
    passwordHasher.hash.mockResolvedValue('temporary-hash');
    users.update.mockResolvedValue(undefined);

    const temporaryPassword = await service.resetPassword(admin, editor.id);

    expect(temporaryPassword).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(authorizationService.authorize).toHaveBeenCalledWith(
      AdminPolicy,
      'manageEditor',
      admin,
      editor,
    );
    expect(users.update).toHaveBeenCalledWith(editor.id, {
      passwordHash: 'temporary-hash',
    });
    expect(sessions.revokeAll).toHaveBeenCalledWith(editor.id);
  });
});
