import { ClientDashboardDto, VisitDto } from "@gym/shared-types";

export const currentMonth = new Date().toISOString().slice(0, 7);

export const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric"
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export function getDaysLeft(endDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const start = new Date(`${today}T00:00:00`).getTime();
  return Math.ceil((end - start) / 86_400_000);
}

export function getVisitsThisMonth(visits: VisitDto[]) {
  return visits.filter((visit) => visit.visitDate.startsWith(currentMonth)).length;
}

export function getLastVisits(dashboards: ClientDashboardDto[], limit = 5) {
  return dashboards
    .flatMap((dashboard) => dashboard.visits)
    .sort((left, right) => right.visitDate.localeCompare(left.visitDate))
    .slice(0, limit);
}
