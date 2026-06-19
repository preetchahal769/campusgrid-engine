-- Delete users of type STAFF first to prevent foreign key or enum failure
DELETE FROM "users" WHERE "role" = 'STAFF';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'BURSAR', 'LIBRARIAN', 'ACADEMIC_COORDINATOR', 'TRANSPORT_MANAGER', 'CLERK');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;
