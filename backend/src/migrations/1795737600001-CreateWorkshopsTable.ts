import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkshopsTable1795737600001 implements MigrationInterface {
  name = 'CreateWorkshopsTable1795737600001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workshops" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(200) NOT NULL,
        "description" character varying(2000) NOT NULL,
        "image_key" character varying NOT NULL,
        "pdf_key" character varying,
        "pdf_name" character varying(120),
        "focus_area_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workshops" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workshops_focus_area" FOREIGN KEY ("focus_area_id")
          REFERENCES "focus_areas" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "workshops"`);
  }
}
