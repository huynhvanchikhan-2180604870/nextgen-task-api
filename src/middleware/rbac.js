// Simple helper to check role within a project document
export const roleOf = (project, userId) =>
  project.members.find((m) => String(m.user) === String(userId))?.role || null;

export const canAdminProject = (project, userId) => {
  const role = roleOf(project, userId);
  return role === "owner" || role === "admin";
};
