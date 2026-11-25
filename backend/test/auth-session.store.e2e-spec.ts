import type { INestApplication } from '@nestjs/common';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AuthSessionStore } from '../src/auth/stores/auth-session.store.js';

describe('AuthSessionStore contract', () => {
    let app: INestApplication<App>;
    let store: AuthSessionStore;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        store = app.get(AuthSessionStore);
    });

    afterAll(async () => {
        await app.close();
    });

    describe.each(
        authenticationStoreContract(() => ({ sessions: store }), {
            contracts: ['sessions'],
            concurrent: true,
        }),
    )('$name', (testCase) => {
        it('cumple el contrato', () => testCase.run(), 30_000);
    });
});