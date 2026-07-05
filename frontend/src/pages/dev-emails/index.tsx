import { format, parseISO } from "date-fns";
import { useDevEmailsQuery } from "@/features/dev-emails/queries";
import { getErrorMessage } from "@/shared/api";
import { Card } from "@/shared/ui/card";

export function DevEmailsPage() {
  const emailsQuery = useDevEmailsQuery();
  const emails = emailsQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Dev</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Dev emails</h1>
      </div>

      {emailsQuery.isLoading ? <p className="text-sm text-slate-500">Loading dev emails...</p> : null}
      {emailsQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(emailsQuery.error)}</p> : null}
      {emails.length === 0 && !emailsQuery.isLoading ? <p className="text-sm text-slate-500">No dev emails yet.</p> : null}

      <div className="space-y-3">
        {emails.map((email) => (
          <Card key={email.id}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{format(parseISO(email.createdAt), "dd MMM yyyy HH:mm")}</p>
            <h2 className="mt-2 font-semibold text-slate-950">{email.subject}</h2>
            <p className="mt-1 text-sm text-slate-600">To: {email.recipientEmail}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-sm text-slate-700">{email.body}</pre>
          </Card>
        ))}
      </div>
    </section>
  );
}
