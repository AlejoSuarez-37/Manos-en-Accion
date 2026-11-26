import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFocusAreasTable1795737600000 implements MigrationInterface {
  name = 'CreateFocusAreasTable1795737600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "focus_areas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "description" character varying(1000),
        "image_key" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_focus_areas" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "focus_areas"`);
  }
}
