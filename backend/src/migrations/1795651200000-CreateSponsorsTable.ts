import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSponsorsTable1795651200000 implements MigrationInterface {
    name = 'CreateSponsorsTable1795651200000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "sponsor_category" AS ENUM ('corporate_support', 'friend_organizations')`,
        );
        await queryRunner.query(`
    CREATE TABLE "sponsors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "category" "sponsor_category" NOT NULL,
        "website_url" character varying(2048),
        "image_key" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sponsors" PRIMARY KEY ("id")
    )
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sponsors"`);
        await queryRunner.query(`DROP TYPE "sponsor_category"`);
    }
}