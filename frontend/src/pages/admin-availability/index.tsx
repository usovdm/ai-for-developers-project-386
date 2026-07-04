import { useAvailabilitySettingsQuery } from "@/features/availability/queries";
import { getErrorMessage } from "@/shared/api";
import { Card } from "@/shared/ui/card";

export function AdminAvailabilityPage() {
  const availabilityQuery = useAvailabilitySettingsQuery();
  const settings = availabilityQuery.data;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Availability</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Availability settings are global for all event types and are loaded through the API.
        </p>
      </div>

      <Card>
        {availabilityQuery.isLoading ? <p className="text-sm text-slate-500">Loading availability...</p> : null}
        {availabilityQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(availabilityQuery.error)}</p> : null}
        {settings ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-500">Work days</dt>
              <dd className="mt-1 font-medium text-slate-950">{settings.workDays.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Start</dt>
              <dd className="mt-1 font-medium text-slate-950">{settings.startTime}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">End</dt>
              <dd className="mt-1 font-medium text-slate-950">{settings.endTime}</dd>
            </div>
          </dl>
        ) : null}
      </Card>
    </section>
  );
}
