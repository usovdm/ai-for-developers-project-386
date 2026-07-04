import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { adminLoginSchema, type AdminLoginFormValues } from "@/features/auth/schemas";
import { useAdminLoginMutation } from "@/features/auth/queries";
import { getErrorMessage } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

export function AdminLoginPage() {
  const router = useRouter();
  const loginMutation = useAdminLoginMutation();
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginFormValues) {
    await loginMutation.mutateAsync(values);
    await router.navigate({ to: "/admin/event-types" });
  }

  return (
    <section className="max-w-md space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in</h1>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login">
              Login
            </label>
            <Input id="login" autoComplete="username" {...form.register("login")} />
            {form.formState.errors.login ? (
              <p className="text-sm text-red-600">{form.formState.errors.login.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {loginMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(loginMutation.error)}</p> : null}

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
