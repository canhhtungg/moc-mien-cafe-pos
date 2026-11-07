import { NextRequest, NextResponse } from "next/server";
import { assertRoleAllowed, ForbiddenRoleError } from "@/lib/rbac";
import type { StaffRole } from "@/types/cafe";

export function requireRequestRole(
  req: NextRequest,
  allowedRoles: StaffRole[],
  actionLabel: string
): StaffRole {
  const headerRole = req.headers.get("x-staff-role");
  const queryRole = req.nextUrl.searchParams.get("role");
  return assertRoleAllowed(headerRole ?? queryRole, allowedRoles, actionLabel);
}

export function handleApiError(err: unknown, fallbackMsg: string) {
  if (err instanceof ForbiddenRoleError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : fallbackMsg },
    { status: 400 }
  );
}
