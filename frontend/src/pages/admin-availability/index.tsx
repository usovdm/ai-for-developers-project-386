import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { availabilityFormSchema, type AvailabilityFormValues } from "@/features/availability/schemas";
import { useAvailabilitySettingsQuery, useUpdateAvailabilitySettingsMutation } from "@/features/availability/queries";
import type { DayOfWeek } from "@/shared/api";
import { getErrorMessage } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const timeOptions = Array.from({ length: 24 * 4 + 1 }, (_, index) => {
  const minutes = index * 15;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export function AdminAvailabilityPage() {
  const availabilityQuery = useAvailabilitySettingsQuery();
  const updateMutation = useUpdateAvailabilitySettingsMutation();
  const settings = availabilityQuery.data;
  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: { workDays: [], startTime: "09:00", endTime: "18:00" },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [form, settings]);

  async function onSubmit(values: AvailabilityFormValues) {
    await updateMutation.mutateAsync(values);
  }

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
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">Work days</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {days.map((day) => (
                  <label key={day} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" value={day} {...form.register("workDays")} />
                    {day}
                  </label>
                ))}
              </div>
              {form.formState.errors.workDays ? (
                <p className="text-sm text-red-600">{form.formState.errors.workDays.message}</p>
              ) : null}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="startTime">
                  Start
                </label>
                <select id="startTime" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" {...form.register("startTime")}>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="endTime">
                  End
                </label>
                <select id="endTime" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" {...form.register("endTime")}>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {form.formState.errors.endTime ? (
                  <p className="text-sm text-red-600">{form.formState.errors.endTime.message}</p>
                ) : null}
              </div>
            </div>

            {updateMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(updateMutation.error)}</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-green-700">Availability saved</p> : null}

            <Button type="submit" disabled={updateMutation.isPending}>
              Save availability
            </Button>
          </form>
        ) : null}
      </Card>
    </section>
  );
}
