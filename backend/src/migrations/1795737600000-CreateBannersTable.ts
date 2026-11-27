import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBannersTable1795737600000 implements MigrationInterface {
    name = 'CreateBannersTable1795737600000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
    CREATE TABLE "banners" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "position" integer NOT NULL,
        "image_key" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_banners" PRIMARY KEY ("id")
    )
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "banners"`);
    }
}
