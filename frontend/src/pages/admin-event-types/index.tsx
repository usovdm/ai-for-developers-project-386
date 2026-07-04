import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { eventTypeFormSchema, type EventTypeFormValues } from "@/features/event-types/schemas";
import {
  useAdminEventTypesQuery,
  useCreateEventTypeMutation,
  useDeleteEventTypeMutation,
} from "@/features/event-types/queries";
import { getErrorMessage } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function AdminEventTypesPage() {
  const eventTypesQuery = useAdminEventTypesQuery();
  const createMutation = useCreateEventTypeMutation();
  const deleteMutation = useDeleteEventTypeMutation();
  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      durationMinutes: 30,
    },
  });

  async function onSubmit(values: EventTypeFormValues) {
    await createMutation.mutateAsync(values);
    form.reset();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Event types</h1>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input id="title" {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea id="description" {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="durationMinutes">
                Duration
              </label>
              <select
                id="durationMinutes"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                {...form.register("durationMinutes", { valueAsNumber: true })}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>

            {createMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</p> : null}

            <Button type="submit" disabled={createMutation.isPending}>
              Create event type
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-3">
        {(eventTypesQuery.data ?? []).map((eventType) => (
          <Card key={eventType.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">{eventType.title}</p>
                <p className="mt-1 text-sm text-slate-600">{eventType.description}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  {eventType.durationMinutes} min / {eventType.color}
                </p>
              </div>
              <Button variant="danger" onClick={() => deleteMutation.mutate(eventType.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}

        {eventTypesQuery.isLoading ? <p className="text-sm text-slate-500">Loading event types...</p> : null}
        {eventTypesQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(eventTypesQuery.error)}</p> : null}
      </div>
    </section>
  );
}
