import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthSessionsTable1763740800001
    implements MigrationInterface {
    name = 'CreateAuthSessionsTable1763740800001';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
    CREATE TABLE "auth_sessions" (
        "id" character varying(64) NOT NULL,
        "user_id" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "mfa" jsonb,
        "metadata" jsonb,
        CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id")
    )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_auth_sessions_user_id" ON "auth_sessions" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_auth_sessions_expires_at" ON "auth_sessions" ("expires_at")`,
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_auth_sessions_expires_at"`);
        await queryRunner.query(`DROP INDEX "IDX_auth_sessions_user_id"`);
        await queryRunner.query(`DROP TABLE "auth_sessions"`);
    }
}