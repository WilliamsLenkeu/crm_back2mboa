import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, userAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...adminAc.statements,
});

/** Manager : accès CRM, aucune permission admin (users). */
export const managerRole = ac.newRole({
  ...userAc.statements,
});
