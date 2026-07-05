import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { eventTypeFormSchema, type EventTypeFormValues } from "@/features/event-types/schemas";
import {
  useAdminEventTypesQuery,
  useCreateEventTypeMutation,
  useDeleteEventTypeMutation,
  useUpdateEventTypeMutation,
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
  const updateMutation = useUpdateEventTypeMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      durationMinutes: 30,
    },
  });

  async function onSubmit(values: EventTypeFormValues) {
    if (editingId) {
      await updateMutation.mutateAsync({ eventTypeId: editingId, values });
      setEditingId(null);
    } else {
      await createMutation.mutateAsync(values);
    }
    form.reset();
  }

  function startEditing(eventType: EventTypeFormValues & { id: string }) {
    setEditingId(eventType.id);
    form.reset({
      title: eventType.title,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
    });
  }

  function cancelEditing() {
    setEditingId(null);
    form.reset({ title: "", description: "", durationMinutes: 30 });
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
              {form.formState.errors.title ? (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea id="description" {...form.register("description")} />
              {form.formState.errors.description ? (
                <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
              ) : null}
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
            {updateMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(updateMutation.error)}</p> : null}

            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save event type" : "Create event type"}
            </Button>
            {editingId ? (
              <Button className="ml-2" type="button" variant="secondary" onClick={cancelEditing}>
                Cancel
              </Button>
            ) : null}
          </form>
        </Card>
      </div>

      <div className="space-y-3">
        {deleteMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(deleteMutation.error)}</p> : null}

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
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => startEditing(eventType)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(eventType.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {eventTypesQuery.isLoading ? <p className="text-sm text-slate-500">Loading event types...</p> : null}
        {eventTypesQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(eventTypesQuery.error)}</p> : null}
      </div>
    </section>
  );
}
