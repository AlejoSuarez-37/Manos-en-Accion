import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTeamMemberActiveColumn1764240000000
  implements MigrationInterface
{
  name = 'DropTeamMemberActiveColumn1764240000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP COLUMN "active"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD "active" boolean NOT NULL DEFAULT true`,
    );
  }
}
