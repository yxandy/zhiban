export function buildDepartmentAnchorId(departmentName: string): string {
  return `dept-${encodeURIComponent(departmentName)}`;
}
